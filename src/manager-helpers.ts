import { logger } from 'storybook/internal/client-logger'
import './types'
import type { ConsentStatus } from './types'
import { useConsentStore } from './consent-store'
import { useStorybookApi, type API } from 'storybook/manager-api'
export { useConsentStore } from './consent-store'

type AllowedScope = 'page' | 'visit' | 'nextPageOnly'

function _pushVar(
  index: number,
  name: string,
  value: string | number | undefined,
  scope: AllowedScope,
) {
  window._uxa.push(['setCustomVariable', index, name, value, scope])
}

export function trackCurrentStoryContext(
  api: API,
  scope: AllowedScope = 'nextPageOnly',
) {
  logger.debug('Tracking current story context for CS scope:', scope)

  const storyData = api.getCurrentStoryData()
  const storyType = 'subtype' in storyData ? storyData.subtype : storyData.type
  const urlParams = new URLSearchParams(window.location.search)
  const globalsParam = urlParams.get('globals')?.replace(':!', '=')
  const argsParam = urlParams.get('args')?.replace(':!', '=')

  _pushVar(0, 'storyId', storyData.id, scope)
  _pushVar(1, 'type', storyType, scope)
  _pushVar(2, 'title', storyData.title, scope)
  _pushVar(3, 'name', storyData.name, scope)
  _pushVar(4, 'tags', storyData.tags.join(';'), scope)
  if (globalsParam) {
    _pushVar(5, 'globals', globalsParam, scope)
  }
  if (argsParam) {
    _pushVar(6, 'args', argsParam, scope)
  }

  const params = new URLSearchParams(window.location.search)
  const pathParam = params.get('path') ?? '/'
  params.delete('path')
  let p = decodeURIComponent(pathParam)
  if (!p.startsWith('/')) p = '/' + p
  const rest = params.toString()

  window._uxa.push(['setPath', p])
  window._uxa.push(['setQuery', rest])
  // window._uxa.push(['trackPageView'])
}

export function trackPreviewInitialized(api: API) {
  logger.debug('Tracking initial story render in Contentsquare.')
  trackCurrentStoryContext(api)
}

export function trackStoryChange(
  storyId: string,
  api: API = useStorybookApi(),
) {
  logger.debug('Tracking story change in Contentsquare.', { storyId })
  trackCurrentStoryContext(api)
}

export function trackEvent(event: { name: string }) {
  logger.debug('Tracking event in Contentsquare.', event)

  window._uxa.push(['trackPageEvent', event.name])
}

export function trackError(event: { id: string; message: string }) {
  logger.debug('Tracking error in Contentsquare.', event)

  window._uxa.push(['trackError', `${event.id}: ${event.message}`])
}

// Export store helpers for third-party reactive controls
export function getConsentStatus(): ConsentStatus {
  return useConsentStore((state) => state.consentStatus)
}

export function setConsentStatus(consent: boolean): void {
  useConsentStore.getState().setConsent(consent)
}

export function subscribeToConsentStatus(
  callback: (state: ConsentStatus, prevState: ConsentStatus) => void,
) {
  return useConsentStore.subscribe((state, prevState) =>
    callback(state.consentStatus, prevState.consentStatus),
  )
}
