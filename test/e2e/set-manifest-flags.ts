import { execSync } from 'child_process';
import fs from 'fs';
import { merge } from 'lodash';
import { ManifestFlags } from '../../app/scripts/lib/manifestFlags';

export const folder = `dist/${process.env.SELENIUM_BROWSER}`;

function parseIntOrUndefined(value: string | undefined): number | undefined {
  return value ? parseInt(value, 10) : undefined;
}

/**
 * Search a string for `flags = {...}` and return ManifestFlags if it exists
 *
 * @param str - The string to search
 * @param errorType - The type of error to log if parsing fails
 * @returns The ManifestFlags object if valid, otherwise undefined
 */
function regexSearchForFlags(
  str: string,
  errorType: string,
): ManifestFlags | undefined {
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

  return undefined;
}

/**
 * Add flags from the GitHub PR body if they are set
 *
 * To use this feature, add a line to your PR body like:
 * `flags = {"sentry": {"tracesSampleRate": 0.1}}`
 * (must be valid JSON)
 *
 * @param flags - The flags object to add to
 */
function addFlagsFromPrBody(flags: ManifestFlags) {
  let body;

  try {
    body = fs.readFileSync('changed-files/pr-body.txt', 'utf8');
  } catch (error) {
    console.debug('No pr-body.txt, ignoring flags');
    return;
  }

  const newFlags = regexSearchForFlags(body, 'PR body');

  if (newFlags) {
    // Use lodash merge to do a deep merge (spread operator is shallow)
    merge(flags, newFlags);
  }
}

/**
 * Add flags from the Git message if they are set
 *
 * To use this feature, add a line to your commit message like:
 * `flags = {"sentry": {"tracesSampleRate": 0.1}}`
 * (must be valid JSON)
 *
 * @param flags - The flags object to add to
 */
function addFlagsFromGitMessage(flags: ManifestFlags) {
  const gitMessage = execSync(
    `git show --format='%B' --no-patch "HEAD"`,
  ).toString();

  const newFlags = regexSearchForFlags(gitMessage, 'git message');

  if (newFlags) {
    // Use lodash merge to do a deep merge (spread operator is shallow)
    merge(flags, newFlags);
  }
}

// Alter the manifest with CircleCI environment variables and custom flags
export function setManifestFlags(flags: ManifestFlags = {}) {
  if (process.env.CIRCLECI) {
    flags.circleci = {
      enabled: true,
      branch: process.env.CIRCLE_BRANCH,
      buildNum: parseIntOrUndefined(process.env.CIRCLE_BUILD_NUM),
      job: process.env.CIRCLE_JOB,
      nodeIndex: parseIntOrUndefined(process.env.CIRCLE_NODE_INDEX),
      prNumber: parseIntOrUndefined(
        process.env.CIRCLE_PULL_REQUEST?.split('/').pop(), // The CIRCLE_PR_NUMBER variable is only available on forked Pull Requests
      ),
    };

    addFlagsFromPrBody(flags);
    addFlagsFromGitMessage(flags);
  }

  const manifest = JSON.parse(
    fs.readFileSync(`${folder}/manifest.json`).toString(),
  );

  manifest._flags = flags;

  fs.writeFileSync(`${folder}/manifest.json`, JSON.stringify(manifest));
}
