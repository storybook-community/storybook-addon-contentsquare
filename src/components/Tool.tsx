import React, { useCallback } from 'react'
import { addons } from 'storybook/manager-api'
import {
  Badge,
  IconButton,
  TooltipMessage,
  WithTooltip,
} from 'storybook/internal/components'
import { logger } from 'storybook/internal/client-logger'
import { styled } from 'storybook/theming'

import { KEY } from '../constants'
import type { ContentsquareConfig } from '../types'
import { useConsentStore } from '../consent-store'
import { CSLogoIcon } from './CSLogoIcon'

const csLight = '#FFBDBD'
const csDark = '#7C0033'

const EnabledPill = styled(Badge)(({ theme }) => ({
  position: 'absolute',
  top: 7,
  right: 7,
  transform: 'translate(50%, -50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 3,
  height: 6,
  minWidth: 6,
  lineHeight: 'px',
  fontSize: theme.typography.size.s1 - 1,
  background: theme.base === 'light' ? csDark : csLight,
  color: theme.color.lightest,
}))

export const Tool = function Tool() {
  const { [KEY]: parameters } = addons.getConfig() as {
    [KEY]: ContentsquareConfig
  }

  const {
    consentTitle = 'Contentsquare Analytics',
    initialConsentDesc = 'We use cookies to track visitor behaviour and help us improve our content. You can opt out at any time.',
    initialAcceptLabel = 'Allow cookies',
    initialRefuseLabel = 'Opt out',
    optedInDesc = 'Visitor behaviour tracking is enabled.',
    optedOutDesc = 'Visitor behaviour tracking is disabled.',
    acceptLabel = 'Enable tracking',
    refuseLabel = 'Disable tracking',
    tagId,
  } = parameters ?? {}

  const consentStatus = useConsentStore((state) => state.consentStatus)
  const setConsent = useConsentStore((state) => state.setConsent)
  const currentlyTracking = consentStatus === 'opted-in'

  const getLinks = useCallback(
    (close: () => void) => {
      const links = []

      if (consentStatus !== 'opted-out') {
        links.push({
          title: consentStatus === null ? initialRefuseLabel : refuseLabel,
          onClick: () => {
            logger.debug('User refused Contentsquare tracking.')
            setConsent(false)
            close()
          },
        })
      }

      if (consentStatus !== 'opted-in') {
        links.push({
          title: consentStatus === null ? initialAcceptLabel : acceptLabel,
          onClick: () => {
            logger.debug('User accepted Contentsquare tracking.')
            setConsent(true)
            close()
          },
        })
      }

      return links
    },
    [
      consentStatus,
      setConsent,
      initialAcceptLabel,
      initialRefuseLabel,
      acceptLabel,
      refuseLabel,
    ],
  )

  const desc =
    consentStatus === 'opted-in'
      ? optedInDesc
      : consentStatus === 'opted-out'
        ? optedOutDesc
        : initialConsentDesc

  // TODO: Fix accessibility for 10.1 with the new popover components.
  return tagId ? (
    <WithTooltip
      trigger="click"
      startOpen={consentStatus === null}
      placement="bottom-end"
      tooltip={({ onHide }) => (
        <div id="contentsquare-consent-popover">
          <TooltipMessage
            title={consentTitle}
            desc={desc}
            links={getLinks(onHide)}
          />
        </div>
      )}
    >
      <IconButton
        aria-label={
          currentlyTracking
            ? 'Contentsquare tracking enabled'
            : 'Contentsquare tracking disabled'
        }
        aria-haspopup="dialog"
        size="small"
        padding="small"
      >
        <CSLogoIcon />
        {currentlyTracking && <EnabledPill />}
      </IconButton>
    </WithTooltip>
  ) : null
}
