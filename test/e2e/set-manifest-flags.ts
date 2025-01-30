import fs from 'fs';
import { merge } from 'lodash';
import { ManifestFlags } from '../../app/scripts/lib/manifestFlags';
import { fetchManifestFlagsFromPRAndGit } from '../../development/lib/get-manifest-flag';

export const folder = `dist/${process.env.SELENIUM_BROWSER}`;

type ManifestType = { _flags?: ManifestFlags; manifest_version: string };
let manifest: ManifestType;

function parseIntOrUndefined(value: string | undefined): number | undefined {
  return value ? parseInt(value, 10) : undefined;
}

// Alter the manifest with CircleCI environment variables and custom flags
export async function setManifestFlags(flags: ManifestFlags = {}) {
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

    const additionalManifestFlags = await fetchManifestFlagsFromPRAndGit();
    merge(flags, additionalManifestFlags);

    // Set `flags.sentry.forceEnable` to true by default
    if (flags.sentry === undefined) {
      flags.sentry = {};
    }
    if (flags.sentry.forceEnable === undefined) {
      flags.sentry.forceEnable = true;
    }
  }

  readManifest();

  manifest._flags = flags;

  fs.writeFileSync(`${folder}/manifest.json`, JSON.stringify(manifest));
}

export function getManifestVersion(): number {
  readManifest();

  return parseInt(manifest.manifest_version, 10);
}

function readManifest() {
  if (!manifest) {
    manifest = JSON.parse(
      fs.readFileSync(`${folder}/manifest.json`).toString(),
    );
  }
}
