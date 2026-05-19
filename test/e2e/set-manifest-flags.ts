import nodeCrypto from 'crypto';
import fs from 'fs';
import { merge } from 'lodash';
import { ManifestFlags } from '../../shared/lib/manifestFlags';
import { fetchManifestFlagsFromPRAndGit } from '../../development/lib/get-manifest-flag';

if (process.env.SELENIUM_BROWSER === undefined) {
  process.env.SELENIUM_BROWSER = 'chrome';
}

export const folder = `dist/${process.env.SELENIUM_BROWSER}`;

type ManifestType = {
  _flags?: ManifestFlags;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  manifest_version: string;
  /**
   * The public key assigned to the extension's manifest to get consistent id. (For OAuth2 WAF redirect)
   */
  key?: string;
};
let manifest: ManifestType;

function parseIntOrUndefined(value: string | undefined): number | undefined {
  return value ? parseInt(value, 10) : undefined;
}

// Alter the manifest with CI environment variables and custom flags
export async function setManifestFlags(flags: ManifestFlags = {}) {
  if (process.env.CI) {
    flags.ci = {
      enabled: true,
      branch: process.env.BRANCH,
      commitHash: process.env.HEAD_COMMIT_HASH,
      job: process.env.JOB_NAME?.split(' ')[0], // Remove matrix info
      matrixIndex: parseIntOrUndefined(process.env.MATRIX_INDEX),
      prNumber: parseIntOrUndefined(process.env.PR_NUMBER),
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

  if (process.env.MULTIPROVIDER && 'key' in manifest) {
    // Replace the key with a freshly generated one so dist/chrome gets a
    // different deterministic extension ID than dist/chrome2 (which keeps
    // the original key from the copy). This avoids the same-key conflict
    // while keeping both IDs computable without scraping chrome://extensions.
    manifest.key = nodeCrypto
      .generateKeyPairSync('rsa', { modulusLength: 2048 })
      .publicKey.export({ type: 'spki', format: 'pem' })
      .toString()
      .replace(/-----(BEGIN|END) PUBLIC KEY-----|\n/gu, '');
  }

  fs.writeFileSync(
    `${folder}/manifest.json`,
    JSON.stringify(manifest, null, 2),
  );
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
