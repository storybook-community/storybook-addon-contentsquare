import { fixupConfigRules } from '@eslint/compat'
import js from '@eslint/js'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import reactPlugin from 'eslint-plugin-react'
import storybook from 'eslint-plugin-storybook'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default [
  {
    ignores: [
      '.github/dependabot.yml',
      '!.*',
      'dist/',
      'scripts/',
      '*.tgz',
      'coverage/',
      'node_modules/',
      'storybook-static/',
      'build-storybook.log',
      '.DS_Store',
      '.env',
      '.idea',
      '.vscode',
    ],
  },
  js.configs.recommended,
  // eslint-plugin-react does not support ESLint 10 yet
  ...fixupConfigRules(reactPlugin.configs.flat.recommended),
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  ...tseslint.configs.recommended,
  {
    files: ['preset.js', '.storybook/local-preset.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  prettierRecommended,
  ...storybook.configs['flat/recommended'],
]
