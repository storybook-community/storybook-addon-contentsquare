import preview from '../../.storybook/preview'
import { fn } from 'storybook/test'

import { Header } from './Header'

const meta = preview.meta({
  title: 'Example/Header',
  component: Header,
  args: {
    onLogin: fn(),
    onLogout: fn(),
    onCreateAccount: fn(),
  },
  parameters: {
    layout: 'fullscreen',
  },
  tags: [],
})

export const LoggedIn = meta.story({
  args: {
    user: {
      name: 'Jane Doe',
    },
  },
})

export const LoggedOut = meta.story()
