import { defineConfig, type Options } from 'tsup'

export default defineConfig(async () => {
  const packageJson = (
    await import('./package.json', { with: { type: 'json' } })
  ).default

  const { bundler: { managerEntries = [], previewEntries = [] } = {} } =
    packageJson

  const commonConfig: Options = {
    splitting: true,
    format: ['esm'],
    treeshake: true,
    clean: false,
    external: ['react', 'react-dom', '@storybook/icons'],
  }

  const configs: Options[] = []

  // preview entries are entries meant to be loaded into the preview iframe
  // they'll have preview-specific packages externalized and they won't be usable in node
  // they'll have types generated for them so they can be imported when setting up Portable Stories
  if (previewEntries.length) {
    configs.push({
      ...commonConfig,
      entry: previewEntries,
      platform: 'browser',
      target: 'esnext',
      dts: true,
    })
  }

  // manager entries are entries meant to be loaded into the manager UI
  // they'll have manager-specific packages externalized and they won't be usable in node
  if (managerEntries.length) {
    configs.push({
      ...commonConfig,
      entry: managerEntries,
      platform: 'browser',
      target: 'esnext',
      dts: true,
    })
  }

  return configs
})
