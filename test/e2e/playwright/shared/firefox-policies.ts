/**
 * Firefox extension installation via enterprise policies.
 * Uses PLAYWRIGHT_FIREFOX_POLICIES_JSON so Playwright's patched Firefox loads
 * the extension automatically (see browser.policies.alternatePath in Playwright).
 *
 * @see https://github.com/microsoft/playwright/issues/7297#issuecomment-3333317209
 * @see https://mozilla.github.io/policy-templates/#extensionsettings
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';
import { execSync } from 'child_process';

const METAMASK_FIREFOX_EXTENSION_ID = 'webextension@metamask.io';

/**
 * Resolve absolute path to the built Firefox extension directory.
 */
function getFirefoxExtensionDir(): string {
  const fromRepoRoot = path.join(process.cwd(), 'dist', 'firefox');
  if (fs.existsSync(fromRepoRoot)) {
    return path.resolve(fromRepoRoot);
  }
  const fromShared = path.join(__dirname, '../../../../dist/firefox');
  if (fs.existsSync(fromShared)) {
    return path.resolve(fromShared);
  }
  throw new Error(
    'dist/firefox not found. Build the Firefox extension first: yarn dist (with platform firefox) or ENABLE_MV3=false yarn build dist',
  );
}

/**
 * Create a temporary .xpi file by zipping the unpacked extension directory.
 * Firefox ExtensionSettings install_url expects an XPI URL.
 */
function createTempXpi(extensionDir: string): string {
  const xpiPath = path.join(
    os.tmpdir(),
    `metamask-playwright-${Date.now()}.xpi`,
  );
  const cwd = extensionDir;
  try {
    execSync(`zip -r "${xpiPath}" .`, { cwd, stdio: 'pipe' });
  } catch {
    throw new Error(
      'Creating .xpi from dist/firefox failed. Ensure "zip" is available (macOS/Linux) or build a Firefox .xpi manually.',
    );
  }
  return xpiPath;
}

/**
 * Write policies.json that force-installs the MetaMask extension.
 * Sets process.env.PLAYWRIGHT_FIREFOX_POLICIES_JSON so Playwright's Firefox uses it.
 *
 * @returns Path to the written policies.json file.
 */
export function setupFirefoxPolicies(): string {
  const extensionDir = getFirefoxExtensionDir();
  const xpiPath = createTempXpi(extensionDir);
  const installUrl = pathToFileURL(xpiPath).href;

  const policies = {
    policies: {
      ExtensionSettings: {
        [METAMASK_FIREFOX_EXTENSION_ID]: {
          installation_mode: 'force_installed',
          install_url: installUrl,
        },
      },
    },
  };

  const policiesPath = path.join(
    os.tmpdir(),
    `playwright-firefox-policies-${Date.now()}.json`,
  );
  fs.writeFileSync(policiesPath, JSON.stringify(policies, null, 2), 'utf8');
  process.env.PLAYWRIGHT_FIREFOX_POLICIES_JSON = policiesPath;
  return policiesPath;
}
