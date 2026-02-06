#!/usr/bin/env bun

/**
 * Get the next version based on the conventional commits.
 * @param currentVersion - The current version.
 * @returns The next version.
 * @param releaseType - The type of release: 'major', 'minor', or 'patch'. Optional.
 * @returns The release type.
 */
// USAGE: bun scripts/get-next-version.ts <currentVersion> [--releaseType]


import { Bumper } from 'conventional-recommended-bump'
import { inc } from 'semver'

const args = Bun.argv.slice(2);
// console.log('Args:', args);
const currentVersion = args[0];
const isReleaseTypeRequested = args.includes('--releaseType');

if (!currentVersion || currentVersion.startsWith('--')) {
  console.error('Usage: bun get-next-version.ts <currentVersion> [--releaseType]');
  process.exit(1);
}

const bumper = new Bumper().loadPreset('conventionalcommits')
const recommendation = await bumper.bump()
//@ts-ignore
const releaseType = recommendation.releaseType
const nextVersion = inc(currentVersion, releaseType)

isReleaseTypeRequested
  ? console.log(releaseType)
  : console.log(nextVersion);
