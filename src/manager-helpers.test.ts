import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { API } from 'storybook/manager-api'

import {
  setConsentStatus,
  subscribeToConsentStatus,
  trackCurrentStoryContext,
  trackError,
  trackEvent,
  useConsentStore,
} from './manager-helpers'

type Entry = ReturnType<API['getCurrentStoryData']>

const primaryStory = {
  type: 'story',
  subtype: 'story',
  id: 'example-button--primary',
  name: 'Primary',
  title: 'Example/Button',
  importPath: './src/stories/Button.stories.ts',
  exportName: 'Primary',
  parent: 'example-button',
  depth: 2,
  tags: ['dev', 'test'],
  prepared: true,
} satisfies Entry

function apiFor(entry: Entry) {
  return { getCurrentStoryData: () => entry } as API
}

describe('manager helpers', () => {
  beforeEach(() => {
    window._uxa = []
  })

  afterEach(() => {
    window.history.replaceState(null, '', '/')
    localStorage.clear()
    useConsentStore.setState({ consentStatus: null })
    vi.restoreAllMocks()
  })

  describe('trackCurrentStoryContext', () => {
    it('sends the story as custom variables', () => {
      window.history.replaceState(
        null,
        '',
        '/?path=/story/example-button--primary',
      )

      trackCurrentStoryContext(apiFor(primaryStory), 'page')

      expect(window._uxa).toEqual(
        expect.arrayContaining([
          [
            'setCustomVariable',
            0,
            'storyId',
            'example-button--primary',
            'page',
          ],
          ['setCustomVariable', 1, 'type', 'story', 'page'],
          ['setCustomVariable', 2, 'title', 'Example/Button', 'page'],
          ['setCustomVariable', 3, 'name', 'Primary', 'page'],
          ['setCustomVariable', 4, 'tags', 'dev;test', 'page'],
        ]),
      )
    })

    it('scopes the variables to the next page by default', () => {
      trackCurrentStoryContext(apiFor(primaryStory))

      expect(window._uxa[0]?.[4]).toBe('nextPageOnly')
    })

    it('sends the globals and args from the URL', () => {
      window.history.replaceState(
        null,
        '',
        '/?path=/story/example-button--primary&globals=theme:!dark&args=label:!Hi',
      )

      trackCurrentStoryContext(apiFor(primaryStory))

      expect(window._uxa).toContainEqual([
        'setCustomVariable',
        5,
        'globals',
        'theme=dark',
        'nextPageOnly',
      ])
      expect(window._uxa).toContainEqual([
        'setCustomVariable',
        6,
        'args',
        'label=Hi',
        'nextPageOnly',
      ])
    })

    it('leaves out globals and args that are not in the URL', () => {
      trackCurrentStoryContext(apiFor(primaryStory))

      const names = window._uxa.map((command) => command[2])
      expect(names).not.toContain('globals')
      expect(names).not.toContain('args')
    })

    it('uses the Storybook path as the page path, and the rest as the query', () => {
      window.history.replaceState(
        null,
        '',
        '/?path=/story/example-button--primary&globals=theme:!dark',
      )

      trackCurrentStoryContext(apiFor(primaryStory))

      expect(window._uxa).toContainEqual([
        'setPath',
        '/story/example-button--primary',
      ])
      const query = window._uxa.find((command) => command[0] === 'setQuery')
      expect(new URLSearchParams(String(query?.[1])).get('globals')).toBe(
        'theme:!dark',
      )
    })

    it('uses the root path when the URL has none', () => {
      trackCurrentStoryContext(apiFor(primaryStory))

      expect(window._uxa).toContainEqual(['setPath', '/'])
    })

    it('uses the docs type for docs entries', () => {
      const docs = {
        type: 'docs',
        id: 'example-button--docs',
        name: 'Docs',
        title: 'Example/Button',
        importPath: './src/stories/Button.stories.ts',
        parent: 'example-button',
        depth: 2,
        tags: ['autodocs'],
        prepared: true,
      } satisfies Entry

      trackCurrentStoryContext(apiFor(docs))

      expect(window._uxa).toContainEqual([
        'setCustomVariable',
        1,
        'type',
        'docs',
        'nextPageOnly',
      ])
    })
  })

  it('tracks events as page events', () => {
    trackEvent({ name: 'button-clicked' })

    expect(window._uxa).toEqual([['trackPageEvent', 'button-clicked']])
  })

  it('tracks errors with their ID and message', () => {
    trackError({ id: 'story-errored', message: 'Boom' })

    expect(window._uxa).toEqual([['trackError', 'story-errored: Boom']])
  })

  it('opts out of Contentsquare when consent is withdrawn', () => {
    setConsentStatus(false)

    expect(useConsentStore.getState().consentStatus).toBe('opted-out')
    expect(window._uxa).toContainEqual(['optout'])
  })

  it('notifies subscribers when the consent status changes', () => {
    const callback = vi.fn()
    const unsubscribe = subscribeToConsentStatus(callback)

    setConsentStatus(false)
    unsubscribe()
    useConsentStore.setState({ consentStatus: 'opted-in' })

    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith('opted-out', null)
  })
})
