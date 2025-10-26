import React from 'react'
import { addons, types } from 'storybook/manager-api'
// import Events from 'storybook/internal/core-events'
import { logger } from 'storybook/internal/client-logger'

import { ADDON_ID, KEY, TOOL_ID } from './constants'
import { Tool } from './components/Tool'
// import {
//   trackError,
//   trackPreviewInitialized,
//   trackStoryChange,
// } from './manager-helpers'
import { getConsentStatusFromStorage } from './consent-store'

window._uxa = window._uxa || []

// addons.register(ADDON_ID, (api) => {
addons.register(ADDON_ID, () => {
  logger.debug('Registering Contentsquare addon.')

  // Read config: if no config is passed, don't create a tool and don't trigger analytics.
  const config = addons.getConfig()
  if (!config[KEY]) {
    logger.warn(
      `Contentsquare addon is not configured. Pass options through addons.setConfig() in your manager file to enable analytics.`,
    )
    return
  }
  if (!config[KEY].tagId) {
    logger.error(
      `contentsquare.tagId must be set to your Contentsquare Tag ID. Disabling analytics.`,
    )
    return
  }

  // Register tools.
  const forceTracking =
    config[KEY].iWantToViolatePrivacyLawsAndSpyOnMyColleaguesWithoutTheirConsent
  if (!forceTracking) {
    addons.add(TOOL_ID, {
      type: types.TOOLEXTRA,
      title: 'Contentsquare',
      render: () => <Tool />,
    })
  }

  // Tracker initialisation requires these specific events, and downloading the script.
  window._uxa.push(['setPath', window.location.pathname])

  const g = document.createElement('script')
  const s = document.getElementsByTagName('script')[0]
  g.type = 'text/javascript'
  g.async = true
  g.src = `//t.contentsquare.net/uxa/${process.env.STORYBOOK_CONTENTSQUARE_TAG_ID}.js`

  if (!s || !s.parentNode) {
    logger.error('Failed to find where to inject Contentsquare script element.')
    return
  }
  s.parentNode.insertBefore(g, s)

  // Let contentsquare know immediately whether the user opted out.
  const consentStatus = getConsentStatusFromStorage()
  if (consentStatus !== 'opted-in' && !forceTracking) {
    window._uxa.push(['optout'])
  }

  // Track Storybook events.
  // api.on(Events.PREVIEW_INITIALIZED, () => {
  //   trackPreviewInitialized(api)
  // })

  // api.on(Events.STORY_CHANGED, (storyId) => {
  //   trackStoryChange(storyId, api)
  // })

  // api.on(Events.STORY_ERRORED, ({ title, description }) => {
  //   trackError({
  //     id: 'story-errored',
  //     message: `"${title}" story encountered error: ${description}`,
  //   })
  // })

  // api.on(Events.STORY_THREW_EXCEPTION, (err) => {
  //   trackError({
  //     id: 'story-threw-exception',
  //     message: err,
  //   })
  // })

  // api.on(Events.STORY_MISSING, (id) => {
  //   trackError({
  //     id: 'story-missing',
  //     message: `attempted to render ${id}, but it is missing`,
  //   })
  // })
})
