import { execSync } from 'child_process';
import fs from 'fs';
import { merge } from 'lodash';
import { ManifestFlags } from '../../app/scripts/lib/manifestFlags';

export const folder = `dist/${process.env.SELENIUM_BROWSER}`;

function parseIntOrUndefined(value: string | undefined): number | undefined {
  return value ? parseInt(value, 10) : undefined;
}

/**
 * Grab flags from the Git message if they are set
 *
 * To use this feature, add a line to your commit message like:
 * `flags = {"sentry": {"tracesSampleRate": 0.1}}`
 * (must be valid JSON)
 *
 * @returns flags object if found, undefined otherwise
 */
function getFlagsFromGitMessage(): object | undefined {
  const gitMessage = execSync(
    `git show --format='%B' --no-patch "HEAD"`,
  ).toString();

  // Search gitMessage for `flags = {...}`
  const flagsMatch = gitMessage.match(/flags\s*=\s*(\{.*\})/u);

  if (flagsMatch) {
    try {
      // Get 1st capturing group from regex
      return JSON.parse(flagsMatch[1]);
    } catch (error) {
      console.error(
        'Error parsing flags from git message, ignoring flags\n',
        error,
      );
    }
  }

  return undefined;
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

    const gitMessageFlags = getFlagsFromGitMessage();

    if (gitMessageFlags) {
      // Use lodash merge to do a deep merge (spread operator is shallow)
      flags = merge(flags, gitMessageFlags);
    }
  }

  const manifest = JSON.parse(
    fs.readFileSync(`${folder}/manifest.json`).toString(),
  );

  manifest._flags = flags;

  fs.writeFileSync(`${folder}/manifest.json`, JSON.stringify(manifest));
}
