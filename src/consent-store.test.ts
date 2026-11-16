import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CONSENT_STORAGE_ID } from './constants'

const EXPIRED = 'expires=Thu, 01 Jan 1970 00:00:00 GMT'

// The store reads consent when its module loads, so import a fresh one per test.
async function loadStore() {
  vi.resetModules()
  return import('./consent-store')
}

describe('consent store', () => {
  beforeEach(() => {
    window._uxa = []
    vi.spyOn(window.location, 'reload').mockImplementation(() => {})
  })

  afterEach(() => {
    localStorage.clear()
    document.cookie = `_cs_optout=; path=/; ${EXPIRED}`
    document.cookie = `_cs_optout=; domain=.example.com; path=/; ${EXPIRED}`
    vi.restoreAllMocks()
  })

  it('keeps consent across reloads when opting in on first run', async () => {
    // Contentsquare stores this cookie when the addon opts undecided visitors out.
    document.cookie = '_cs_optout=1; path=/'
    const { useConsentStore, getConsentStatusFromStorage } = await loadStore()

    useConsentStore.getState().setConsent(true)

    expect(localStorage.getItem(CONSENT_STORAGE_ID)).toBe('opted-in')
    expect(getConsentStatusFromStorage()).toBe('opted-in')
  })

  it('reloads to start tracking when opting in on first run', async () => {
    const { useConsentStore } = await loadStore()

    useConsentStore.getState().setConsent(true)

    expect(window.location.reload).toHaveBeenCalledOnce()
  })

  it('clears a Contentsquare opt-out stored on the root domain', async () => {
    document.cookie = '_cs_optout=1; domain=.example.com; path=/'
    const { useConsentStore, getConsentStatusFromStorage } = await loadStore()
    expect(getConsentStatusFromStorage()).toBe('opted-out')

    useConsentStore.getState().setConsent(true)

    expect(document.cookie).not.toContain('_cs_optout')
    expect(getConsentStatusFromStorage()).toBe('opted-in')
  })

  it('clears a Contentsquare opt-out stored in cookieless mode', async () => {
    localStorage.setItem('_cs_optout', '1')
    const { useConsentStore, getConsentStatusFromStorage } = await loadStore()
    expect(getConsentStatusFromStorage()).toBe('opted-out')

    useConsentStore.getState().setConsent(true)

    expect(localStorage.getItem('_cs_optout')).toBeNull()
    expect(getConsentStatusFromStorage()).toBe('opted-in')
  })

  it('opts out of Contentsquare when refusing consent', async () => {
    const { useConsentStore, getConsentStatusFromStorage } = await loadStore()

    useConsentStore.getState().setConsent(false)

    expect(window._uxa).toContainEqual(['optout'])
    expect(getConsentStatusFromStorage()).toBe('opted-out')
    expect(window.location.reload).not.toHaveBeenCalled()
  })
})
