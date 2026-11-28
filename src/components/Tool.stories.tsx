import React from 'react'
import { addons } from 'storybook/manager-api'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { ThemeProvider, convert, themes } from 'storybook/theming/emotion'

import preview from '../../.storybook/preview'
import { CONSENT_STORAGE_ID, KEY } from '../constants'
import { useConsentStore } from '../consent-store'
import type { ConsentStatus, ContentsquareConfig } from '../types'
import { Tool } from './Tool'

// The tool reads its options from the manager's addons config and the consent
// store. Each story sets both up front, then puts them back afterwards.
function setUp(
  config: Partial<ContentsquareConfig> | undefined,
  consentStatus: ConsentStatus,
) {
  const previousConfig = addons.getConfig()[KEY]
  addons.setConfig({ [KEY]: config })
  window._uxa = []
  if (consentStatus) {
    localStorage.setItem(CONSENT_STORAGE_ID, consentStatus)
  } else {
    localStorage.removeItem(CONSENT_STORAGE_ID)
  }
  useConsentStore.setState({ consentStatus })

  return () => {
    addons.setConfig({ [KEY]: previousConfig })
    localStorage.removeItem(CONSENT_STORAGE_ID)
    useConsentStore.setState({ consentStatus: null })
  }
}

const meta = preview.meta({
  title: 'Components/Tool',
  component: Tool,
  // The tool lives in the manager toolbar, which provides Storybook's theme.
  decorators: [
    (Story) => (
      <ThemeProvider theme={convert(themes.light)}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
})

export const FirstVisit = meta.story({
  beforeEach: () => setUp({ tagId: 'test-tag' }, null),
  play: async () => {
    // Visitors who have not decided yet see the consent prompt straight away.
    await expect(
      await screen.findByText(/We use cookies to track visitor behaviour/),
    ).toBeVisible()
    await expect(
      screen.getByRole('button', { name: 'Allow cookies' }),
    ).toBeVisible()
    await expect(screen.getByRole('button', { name: 'Opt out' })).toBeVisible()
    await expect(
      screen.getByRole('button', { name: 'Contentsquare tracking disabled' }),
    ).toBeInTheDocument()
  },
})

export const RefuseOnFirstVisit = meta.story({
  beforeEach: () => setUp({ tagId: 'test-tag' }, null),
  play: async () => {
    await userEvent.click(
      await screen.findByRole('button', { name: 'Opt out' }),
    )

    await expect(useConsentStore.getState().consentStatus).toBe('opted-out')
    await expect(localStorage.getItem(CONSENT_STORAGE_ID)).toBe('opted-out')
    await expect(window._uxa).toContainEqual(['optout'])
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Opt out' }),
      ).not.toBeInTheDocument(),
    )
  },
})

export const OptedIn = meta.story({
  beforeEach: () => setUp({ tagId: 'test-tag' }, 'opted-in'),
  play: async () => {
    const toggle = await screen.findByRole('button', {
      name: 'Contentsquare tracking enabled',
    })
    // The prompt only opens by itself for undecided visitors.
    await expect(
      screen.queryByText('Visitor behaviour tracking is enabled.'),
    ).not.toBeInTheDocument()

    await userEvent.click(toggle)

    await expect(
      await screen.findByText('Visitor behaviour tracking is enabled.'),
    ).toBeVisible()
    await expect(
      screen.queryByRole('button', { name: 'Enable tracking' }),
    ).not.toBeInTheDocument()
  },
})

export const DisableTracking = meta.story({
  beforeEach: () => setUp({ tagId: 'test-tag' }, 'opted-in'),
  play: async () => {
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Contentsquare tracking enabled',
      }),
    )
    await userEvent.click(
      await screen.findByRole('button', { name: 'Disable tracking' }),
    )

    await expect(useConsentStore.getState().consentStatus).toBe('opted-out')
    await expect(window._uxa).toContainEqual(['optout'])
    await expect(
      await screen.findByRole('button', {
        name: 'Contentsquare tracking disabled',
      }),
    ).toBeInTheDocument()
  },
})

export const OptedOut = meta.story({
  beforeEach: () => setUp({ tagId: 'test-tag' }, 'opted-out'),
  play: async () => {
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Contentsquare tracking disabled',
      }),
    )

    await expect(
      await screen.findByText('Visitor behaviour tracking is disabled.'),
    ).toBeVisible()
    // Enabling tracking reloads the page, so this story only checks it is offered.
    await expect(
      screen.getByRole('button', { name: 'Enable tracking' }),
    ).toBeVisible()
    await expect(
      screen.queryByRole('button', { name: 'Disable tracking' }),
    ).not.toBeInTheDocument()
  },
})

export const CustomLabels = meta.story({
  beforeEach: () =>
    setUp(
      {
        tagId: 'test-tag',
        consentTitle: 'Analytics',
        initialConsentDesc: 'May we measure how you use these docs?',
        initialAcceptLabel: 'Yes',
        initialRefuseLabel: 'No',
      },
      null,
    ),
  play: async () => {
    await expect(await screen.findByText('Analytics')).toBeVisible()
    await expect(
      screen.getByText('May we measure how you use these docs?'),
    ).toBeVisible()
    await expect(screen.getByRole('button', { name: 'Yes' })).toBeVisible()
    await expect(screen.getByRole('button', { name: 'No' })).toBeVisible()
  },
})

export const WithoutTagId = meta.story({
  beforeEach: () => setUp({}, null),
  play: async ({ canvasElement }) => {
    // Without a tag ID there is nothing to consent to, so the tool hides.
    await expect(
      screen.queryByRole('button', { name: /Contentsquare tracking/ }),
    ).not.toBeInTheDocument()
    await expect(canvasElement.textContent).toBe('')
  },
})
