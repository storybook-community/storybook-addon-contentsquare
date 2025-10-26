// CS event queue
type ContentsquareEventQueue = (string | number | undefined)[][]
declare global {
  interface Window {
    _uxa: ContentsquareEventQueue
  }
}

export type ConsentStatus = 'opted-in' | 'opted-out' | null

// addons.setConfig options
export interface ContentsquareConfig {
  tagId: string
  consentTitle?: string
  initialConsentDesc?: string
  initialAcceptLabel?: string
  initialRefuseLabel?: string
  optedInDesc?: string
  optedOutDesc?: string
  acceptLabel?: string
  refuseLabel?: string
  consentStatus: ConsentStatus
  iWantToViolatePrivacyLawsAndSpyOnMyColleaguesWithoutTheirConsent?: boolean
}
