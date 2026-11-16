#!/usr/bin/env zx

import { appendFile, readFile } from 'node:fs/promises'

const { PR_NUMBER, GITHUB_RUN_ID, GITHUB_STEP_SUMMARY, DRY_RUN } = process.env

if (!PR_NUMBER || !GITHUB_RUN_ID) {
  console.error(
    chalk.red('PR_NUMBER and GITHUB_RUN_ID are required to publish a canary.'),
  )
  process.exit(1)
}

const packageJson = await readFile('./package.json', 'utf8').then(JSON.parse)
const name = packageJson.name

/**
 * Compute the canary version from the latest release, using the same scheme
 * as auto canary: <next patch>--canary.<PR number>.<run id>.0
 */
const latest = (await $`npm view ${name} version`).stdout.trim()
if (!/^\d+\.\d+\.\d+$/.test(latest)) {
  console.error(chalk.red(`Unexpected latest version for ${name}: ${latest}`))
  process.exit(1)
}

const [major, minor, patch] = latest.split('.').map(Number)
const version = `${major}.${minor}.${patch + 1}--canary.${PR_NUMBER}.${GITHUB_RUN_ID}.0`

$.verbose = true
await $`npm version ${version} --no-git-tag-version`
await $`npm publish --tag canary ${DRY_RUN ? ['--dry-run'] : []}`

if (GITHUB_STEP_SUMMARY) {
  await appendFile(
    GITHUB_STEP_SUMMARY,
    `Published canary version \`${name}@${version}\`\n`,
  )
}
