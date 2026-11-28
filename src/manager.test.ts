import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addons, types, type API } from 'storybook/manager-api'
import { logger } from 'storybook/internal/client-logger'

import { CONSENT_STORAGE_ID, KEY, TOOL_ID } from './constants'

// Registers the addon in Storybook's addon store; each test runs it with addons.loadAddons().
import './manager'

const TAG_SCRIPT_SRC = '//t.contentsquare.net/uxa/test-tag.js'

function loadAddon(config: Record<string, unknown> | undefined) {
  addons.setConfig({ [KEY]: config })
  addons.loadAddons({} as API)
}

function tagScript() {
  return document.querySelector(`script[src="${TAG_SCRIPT_SRC}"]`)
}

function tool() {
  return addons.getElements(types.TOOLEXTRA)[TOOL_ID]
}

describe('manager', () => {
  beforeEach(() => {
    window._uxa = []
    // The addon inserts the Contentsquare tag before the first script on the page.
    document.head.innerHTML = '<script></script>'
    vi.spyOn(logger, 'warn').mockImplementation(() => {})
    vi.spyOn(logger, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    addons.setConfig({ [KEY]: undefined })
    delete addons.getElements(types.TOOLEXTRA)[TOOL_ID]
    document.head.innerHTML = ''
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('does nothing without a configuration', () => {
    loadAddon(undefined)

    expect(logger.warn).toHaveBeenCalledOnce()
    expect(tagScript()).toBeNull()
    expect(tool()).toBeUndefined()
    expect(window._uxa).toEqual([])
  })

  it('does nothing without a tag ID', () => {
    loadAddon({})

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('contentsquare.tagId'),
    )
    expect(tagScript()).toBeNull()
    expect(tool()).toBeUndefined()
  })

  it('loads the Contentsquare tag for the configured tag ID', () => {
    loadAddon({ tagId: 'test-tag' })

    const script = tagScript() as HTMLScriptElement
    expect(script).not.toBeNull()
    expect(script.async).toBe(true)
    expect(window._uxa).toContainEqual(['setPath', window.location.pathname])
  })

  it('adds the consent tool to the toolbar', () => {
    loadAddon({ tagId: 'test-tag' })

    expect(tool()).toMatchObject({
      type: types.TOOLEXTRA,
      title: 'Contentsquare',
    })
  })

  it('opts undecided visitors out until they consent', () => {
    loadAddon({ tagId: 'test-tag' })

    expect(window._uxa).toContainEqual(['optout'])
  })

  it('opts visitors out when they refused consent', () => {
    localStorage.setItem(CONSENT_STORAGE_ID, 'opted-out')

    loadAddon({ tagId: 'test-tag' })

    expect(window._uxa).toContainEqual(['optout'])
  })

  it('tracks visitors who consented', () => {
    localStorage.setItem(CONSENT_STORAGE_ID, 'opted-in')

    loadAddon({ tagId: 'test-tag' })

    expect(window._uxa).not.toContainEqual(['optout'])
  })

  it('tracks everyone without a consent tool when forced to', () => {
    loadAddon({
      tagId: 'test-tag',
      iWantToViolatePrivacyLawsAndSpyOnMyColleaguesWithoutTheirConsent: true,
    })

    expect(tool()).toBeUndefined()
    expect(tagScript()).not.toBeNull()
    expect(window._uxa).not.toContainEqual(['optout'])
  })

  it('reports an error when there is no script to insert the tag next to', () => {
    document.head.innerHTML = ''

    loadAddon({ tagId: 'test-tag' })

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to find where to inject'),
    )
    expect(tagScript()).toBeNull()
  })
})
