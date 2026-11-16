import React, { useCallback } from 'react'
import { addons } from 'storybook/manager-api'
import { Badge, Button, PopoverProvider } from 'storybook/internal/components'
import { logger } from 'storybook/internal/client-logger'
import { styled } from 'storybook/theming/emotion'

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

const Message = styled.div(({ theme }) => ({
  width: 280,
  boxSizing: 'border-box',
  color: theme.color.defaultText,
  lineHeight: '18px',
}))

const Title = styled.div(({ theme }) => ({
  fontWeight: theme.typography.weight.bold,
}))

const Actions = styled.div({
  display: 'flex',
  justifyContent: 'center',
  gap: 8,
  marginTop: 8,
})

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

  const getActions = useCallback(
    (close: () => void) => {
      const actions = []

      if (consentStatus !== 'opted-out') {
        actions.push({
          title: consentStatus === null ? initialRefuseLabel : refuseLabel,
          onClick: () => {
            logger.debug('User refused Contentsquare tracking.')
            setConsent(false)
            close()
          },
        })
      }

      if (consentStatus !== 'opted-in') {
        actions.push({
          title: consentStatus === null ? initialAcceptLabel : acceptLabel,
          onClick: () => {
            logger.debug('User accepted Contentsquare tracking.')
            setConsent(true)
            close()
          },
        })
      }

      return actions
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

  return tagId ? (
    <PopoverProvider
      ariaLabel={consentTitle}
      defaultVisible={consentStatus === null}
      placement="bottom-end"
      padding={15}
      popover={({ onHide }) => (
        <Message id="contentsquare-consent-popover">
          <Title>{consentTitle}</Title>
          <span>{desc}</span>
          <Actions>
            {getActions(onHide).map(({ title, onClick }) => (
              <Button key={title} ariaLabel={false} onClick={onClick}>
                {title}
              </Button>
            ))}
          </Actions>
        </Message>
      )}
    >
      <Button
        ariaLabel={
          currentlyTracking
            ? 'Contentsquare tracking enabled'
            : 'Contentsquare tracking disabled'
        }
        variant="ghost"
        size="small"
        padding="small"
      >
        <CSLogoIcon />
        {currentlyTracking && <EnabledPill />}
      </Button>
    </PopoverProvider>
  ) : null
}
