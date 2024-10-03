import { execSync } from 'child_process';
import fs from 'fs';
import { ManifestFlags } from '../../app/scripts/lib/manifestFlags';

export const folder = `dist/${process.env.SELENIUM_BROWSER}`;

function parseIntOrUndefined(value: string | undefined): number | undefined {
  return value ? parseInt(value, 10) : undefined;
}

// Grab the tracesSampleRate from the git message if it's set
function getTracesSampleRateFromGitMessage(): number | undefined {
  const gitMessage = execSync(
    `git show --format='%B' --no-patch "HEAD"`,
  ).toString();

  // Search gitMessage for `[flags.sentry.tracesSampleRate: 0.000 to 1.000]`
  const tracesSampleRateMatch = gitMessage.match(
    /\[flags\.sentry\.tracesSampleRate: (0*(\.\d+)?|1(\.0*)?)\]/u,
  );

  if (tracesSampleRateMatch) {
    // Return 1st capturing group from regex
    return parseFloat(tracesSampleRateMatch[1]);
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

    const tracesSampleRate = getTracesSampleRateFromGitMessage();

    // 0 is a valid value, so must explicitly check for undefined
    if (tracesSampleRate !== undefined) {
      // Add tracesSampleRate to flags.sentry (which may or may not already exist)
      flags.sentry = { ...flags.sentry, tracesSampleRate };
    }
  }

  const manifest = JSON.parse(
    fs.readFileSync(`${folder}/manifest.json`).toString(),
  );

  manifest._flags = flags;

  fs.writeFileSync(`${folder}/manifest.json`, JSON.stringify(manifest));
}
