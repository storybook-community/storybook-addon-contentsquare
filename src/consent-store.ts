import { create } from 'zustand'
import { logger } from 'storybook/internal/client-logger'
import type { ConsentStatus } from './types'
import { CONSENT_STORAGE_ID } from './constants'

interface ConsentStore {
  consentStatus: ConsentStatus
  setConsent: (consent: boolean) => void
  refreshConsentStatus: () => void
}

export function getConsentStatusFromStorage(): ConsentStatus {
  const cookies = document.cookie.split(';').map((cookie) => cookie.trim())
  for (const cookie of cookies) {
    if (cookie.startsWith('_cs_optout=')) {
      return 'opted-out'
    }
  }

  return localStorage.getItem(CONSENT_STORAGE_ID) as ConsentStatus
}

export const useConsentStore = create<ConsentStore>((set, get) => ({
  consentStatus: getConsentStatusFromStorage(),

  setConsent: (consent: boolean) => {
    const oldConsentStatus = get().consentStatus

    if (consent) {
      localStorage.setItem(CONSENT_STORAGE_ID, 'opted-in')
      set({ consentStatus: 'opted-in' })

      // Destroy _cs_optout cookie then reload for it to take effect.
      if (oldConsentStatus === 'opted-out') {
        document.cookie = '_cs_optout=; path=/; max-age=0'
        window.location.reload()
      }
    } else {
      localStorage.setItem(CONSENT_STORAGE_ID, 'opted-out')
      set({ consentStatus: 'opted-out' })

      // Let Contentsquare do the rest. It will create the cookie.
      window._uxa = window._uxa || []
      window._uxa.push(['optout'])
    }
  },

  refreshConsentStatus: () => {
    const newStatus = getConsentStatusFromStorage()
    if (newStatus !== get().consentStatus) {
      logger.debug('Consent status changed from storage event', {
        old: get().consentStatus,
        new: newStatus,
      })
      set({ consentStatus: newStatus })
    }
  },
}))

// Sync consent status across tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === CONSENT_STORAGE_ID) {
      useConsentStore.getState().refreshConsentStatus()
    }
  })
}
