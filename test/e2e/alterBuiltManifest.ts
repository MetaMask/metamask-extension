/**
 * Before this file was created, there was no way to pass runtime flags from an E2E test to the built extension.
 * (Well okay, more precisely, you could change certain things through Fixtures, and you could change certain things
 * through Ganache parameters, but both of these didn't load until late in the app load. Sentry is one of the first
 * things to load, and it needed a way to get runtime flags very early in the app load.)
 *
 * The way this works is a bit of a hack, but it's the only solution we could come up with that would load early enough:
 *
 * 1) A global beforeEach hook in the E2E tests backs up the manifest.json file
 * 2) The helpers.withFixtures() function calls setManifestFlags(), which reads in the manifest file and parses it
 * 3) We alter the manifest with CircleCI environment variables and custom flags, then write it back to manifest.json
 * 4) The test runs, and the built extension can call getManifestFlags() to get the custom flags
 * 5) A global afterEach hook restores the backup copy of the manifest, so that the next test gets the normal manifest
 */
import fs from 'fs';
import { hasProperty } from '@metamask/utils';
import { ManifestFlags } from '../../app/scripts/lib/manifestFlags';

const folder = `dist/${process.env.SELENIUM_BROWSER}`;

// Global beforeEach hook to backup the manifest.json file
if (typeof beforeEach === 'function' && process.env.SELENIUM_BROWSER) {
  beforeEach(() => {
    console.debug('alterBuiltManifest.ts -- beforeEach hook');

    restoreBackupManifest();

    backupManifest();
  });
}

// Global afterEach hook to restore the backup manifest
if (typeof afterEach === 'function' && process.env.SELENIUM_BROWSER) {
  afterEach(() => {
    console.debug('alterBuiltManifest.ts -- afterEach hook');

    // create manifest.altered.json
    backupManifest('altered');

    restoreBackupManifest();
  });
}

function backupManifest(newExtension = 'backup') {
  fs.cpSync(
    `${folder}/manifest.json`,
    `${folder}/manifest.${newExtension}.json`,
    {
      preserveTimestamps: true,
    },
  );
}

function restoreBackupManifest() {
  if (fs.existsSync(`${folder}/manifest.backup.json`)) {
    // There is technically a race condition here because the OS could allow IO changes from other applications
    // between the `existsSync` call and the `cpSync` call, so wrap in a try/catch and ignore ENOENT errors
    try {
      fs.cpSync(`${folder}/manifest.backup.json`, `${folder}/manifest.json`, {
        preserveTimestamps: true,
      });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        hasProperty(error, 'code') &&
        error.code === 'ENOENT'
      ) {
        console.info(
          'Ignoring ENOENT error when restoring manifest.json backup',
        );
      } else {
        throw error;
      }
    }
  }
}

function parseIntOrUndefined(value: string | undefined): number | undefined {
  return value ? parseInt(value, 10) : undefined;
}

/**
 * Alter the manifest with CircleCI environment variables and custom flags
 *
 * @param flags - Custom flags to set
 * @param flags.circleci - This will usually come in as undefined, and be set in this function
 */
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
  }

  const manifest = JSON.parse(
    fs.readFileSync(`${folder}/manifest.json`).toString(),
  );

  manifest._flags = flags;

  fs.writeFileSync(`${folder}/manifest.json`, JSON.stringify(manifest));
}
