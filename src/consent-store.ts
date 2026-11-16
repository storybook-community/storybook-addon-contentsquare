import { create } from 'zustand'
import { logger } from 'storybook/internal/client-logger'
import type { ConsentStatus } from './types'
import { CONSENT_STORAGE_ID } from './constants'

interface ConsentStore {
  consentStatus: ConsentStatus
  setConsent: (consent: boolean) => void
  refreshConsentStatus: () => void
}

const CS_OPTOUT_ID = '_cs_optout'
const EXPIRED = 'expires=Thu, 01 Jan 1970 00:00:00 GMT'

// Contentsquare stores its opt-out in a cookie, or in localStorage for
// projects with cookieless tracking.
function hasContentsquareOptout(): boolean {
  const cookies = document.cookie.split(';').map((cookie) => cookie.trim())
  return (
    cookies.some((cookie) => cookie.startsWith(`${CS_OPTOUT_ID}=`)) ||
    localStorage.getItem(CS_OPTOUT_ID) !== null
  )
}

// Contentsquare sets its cookies on the site's root domain, which we don't
// know, so expire the cookie on the host and on every parent domain.
function clearContentsquareOptout() {
  document.cookie = `${CS_OPTOUT_ID}=; path=/; ${EXPIRED}`
  const labels = window.location.hostname.split('.')
  for (let i = 0; i < labels.length; i++) {
    const domain = labels.slice(i).join('.')
    document.cookie = `${CS_OPTOUT_ID}=; domain=${domain}; path=/; ${EXPIRED}`
  }
  localStorage.removeItem(CS_OPTOUT_ID)
}

export function getConsentStatusFromStorage(): ConsentStatus {
  if (hasContentsquareOptout()) {
    return 'opted-out'
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

      // The addon opts visitors out of Contentsquare until they consent, and
      // Contentsquare has no opt-in command. Clear its opt-out, then reload
      // for tracking to start.
      if (oldConsentStatus !== 'opted-in') {
        clearContentsquareOptout()
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
