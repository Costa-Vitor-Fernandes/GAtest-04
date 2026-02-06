#!/usr/bin/env bun

/**
 * Get the next version based on the conventional commits.
 * @param currentVersion - The current version.
 * @returns The next version.
 */
// USAGE: bun scripts/get-next-version.ts <currentVersion>


import { Bumper } from 'conventional-recommended-bump'
import { inc } from 'semver'

const currentVersion = Bun.argv[2]
if (!currentVersion) {
  console.error('Current version is required')
  process.exit(1)
}
const bumper = new Bumper().loadPreset('conventionalcommits')
const recommendation = await bumper.bump()
//@ts-ignore
const releaseType = recommendation.releaseType

// setOutput('current', currentVersion)
// setOutput('type', releaseType)
const nextVersion = inc(currentVersion, releaseType)
// setOutput('next', nextVersion)
console.log(nextVersion)

