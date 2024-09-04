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

const folder = `dist/${process.env.SELENIUM_BROWSER}`;

// Global beforeEach hook to backup the manifest.json file
if (typeof beforeEach === 'function' && process.env.SELENIUM_BROWSER) {
  beforeEach(() => {
    restoreBackupManifest();

    fs.cpSync(`${folder}/manifest.json`, `${folder}/manifest.backup.json`, {
      preserveTimestamps: true,
    });
  });
}

// Global afterEach hook to restore the backup manifest
if (typeof afterEach === 'function' && process.env.SELENIUM_BROWSER) {
  afterEach(() => {
    fs.cpSync(`${folder}/manifest.json`, `${folder}/manifest.altered.json`, {
      preserveTimestamps: true,
    });

    restoreBackupManifest();
  });
}

function restoreBackupManifest() {
  if (fs.existsSync(`${folder}/manifest.backup.json`)) {
    fs.cpSync(`${folder}/manifest.backup.json`, `${folder}/manifest.json`, {
      preserveTimestamps: true,
    });
  }
}

/**
 * Alter the manifest with CircleCI environment variables and custom flags
 *
 * @param flags - Custom flags to set
 * @param flags.circleci - This will usually come in as undefined, and be set in this function
 */
export function setManifestFlags(flags: { circleci?: object } = {}) {
  if (process.env.CIRCLECI) {
    flags.circleci = {
      enabled: true,
      branch: process.env.CIRCLE_BRANCH,
      buildNum: process.env.CIRCLE_BUILD_NUM,
      job: process.env.CIRCLE_JOB,
      nodeIndex: process.env.CIRCLE_NODE_INDEX,
      prNumber: process.env.CIRCLE_PR_NUMBER,
    };
  }

  const manifest = JSON.parse(
    fs.readFileSync(`${folder}/manifest.json`).toString(),
  );

  manifest._flags = flags;

  fs.writeFileSync(`${folder}/manifest.json`, JSON.stringify(manifest));
}
