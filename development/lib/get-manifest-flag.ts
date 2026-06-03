import path from 'node:path';
import fs from 'node:fs/promises';
import { promisify } from 'node:util';
import { exec as callbackExec } from 'node:child_process';

import { hasProperty } from '@metamask/utils';
import { merge } from 'lodash';

import type { ManifestFlags } from '../../shared/lib/manifestFlags';

const exec = promisify(callbackExec);
const PR_BODY_FILEPATH = path.resolve(
  __dirname,
  '..',
  '..',
  'changed-files',
  'pr-body.txt',
);

/**
 * Search a string for `flags = {...}` and return ManifestFlags if it exists
 *
 * @param str - The string to search
 * @param errorType - The type of error to log if parsing fails
 * @returns The ManifestFlags object if valid, otherwise undefined
 */
function regexSearchForFlags(str: string, errorType: string): ManifestFlags {
  // Search str for `flags = {...}`
  const flagsMatch = str.match(/flags\s*=\s*(\{.*\})/u);

  if (flagsMatch) {
    try {
      // Get 1st capturing group from regex
      return JSON.parse(flagsMatch[1]);
    } catch (error) {
      console.error(
        `Error parsing flags from ${errorType}, ignoring flags\n`,
        error,
      );
    }
  }

  return {};
}

/**
 * Get flags from the GitHub PR body if they are set
 *
 * To use this feature, add a line to your PR body like:
 * `flags = {"sentry": {"tracesSampleRate": 0.1}}`
 * (must be valid JSON)
 *
 * @returns Any manifest flags found in the PR body
 */
async function getFlagsFromPrBody(): Promise<ManifestFlags> {
  let body: string;
  try {
    body = await fs.readFile(PR_BODY_FILEPATH, 'utf8');
  } catch (error) {
    if (
      error instanceof Error &&
      hasProperty(error, 'code') &&
      error.code === 'ENOENT'
    ) {
      return {};
    }
    throw error;
  }

  return regexSearchForFlags(body, 'PR body');
}

/**
 * Get flags from the Git message if they are set
 *
 * To use this feature, add a line to your commit message like:
 * `flags = {"sentry": {"tracesSampleRate": 0.1}}`
 * (must be valid JSON)
 *
 * @returns Any manifest flags found in the commit message
 */
async function getFlagsFromGitMessage(): Promise<ManifestFlags> {
  const gitMessage = (await exec(`git show --format='%B' --no-patch "HEAD"`))
    .stdout;

  return regexSearchForFlags(gitMessage, 'git message');
}

/**
 * Get any manifest flags found in the PR body and git message.
 *
 * @returns Any manifest flags found
 */
export async function fetchManifestFlagsFromPRAndGit(): Promise<ManifestFlags> {
  const [prBodyFlags, gitMessageFlags] = await Promise.all([
    getFlagsFromPrBody(),
    getFlagsFromGitMessage(),
  ]);

  return merge(prBodyFlags, gitMessageFlags);
}
