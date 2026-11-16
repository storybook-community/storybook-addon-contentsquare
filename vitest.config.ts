import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    environmentOptions: {
      happyDOM: { url: 'https://storybook.example.com/' },
    },
    include: ['src/**/*.test.ts'],
  },
})
