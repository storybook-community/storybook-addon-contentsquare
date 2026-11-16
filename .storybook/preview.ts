import { definePreview } from '@storybook/react-vite'
import addonDocs from '@storybook/addon-docs'

// load the addon from source so this Storybook doesn't need a build
import addonContentsquare from '../src/index'

export default definePreview({
  addons: [addonDocs(), addonContentsquare()],
})
