import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'

export default defineConfig({
  plugins: [react()],
  // Pre-bundle what the stories import, so Vite does not reload the browser
  // mid-run when it discovers them.
  optimizeDeps: {
    include: [
      'storybook/internal/components',
      'storybook/manager-api',
      'storybook/theming/emotion',
      'zustand',
    ],
  },
  test: {
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/stories/**',
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.test.{ts,tsx}',
      ],
      provider: 'istanbul',
    },
    projects: [
      {
        extends: true,
        plugins: [storybookTest({ storybookScript: 'pnpm storybook --ci' })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'happy-dom',
          environmentOptions: {
            // A subdomain, so tests can set cookies on the root domain.
            happyDOM: {
              url: 'https://storybook.example.com/',
              // The manager injects the Contentsquare tag. Never fetch it.
              settings: {
                disableJavaScriptFileLoading: true,
                handleDisabledFileLoadingAsSuccess: true,
              },
            },
          },
          include: ['src/**/*.test.{ts,tsx}'],
        },
      },
    ],
  },
})
