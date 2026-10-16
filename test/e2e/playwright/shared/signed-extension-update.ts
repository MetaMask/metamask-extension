/* eslint-disable @typescript-eslint/naming-convention -- Chrome manifest and profile schemas use snake_case. */

import { execFile } from 'node:child_process';
import { createHash, generateKeyPairSync } from 'node:crypto';
import { createServer } from 'node:http';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  chromium,
  expect,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import { createBlockedNetworkPolicyRules } from '../../../../shared/lib/network-policy';

type ExtensionInfo = {
  id: string;
  location: string;
  permissions: unknown;
  state: string;
  version: string;
};

// The source JSON's API names are strings. Chrome's packer validates them rather
// than asserting that arbitrary JSON already satisfies ManifestPermission[].
type ProbeManifest = Omit<chrome.runtime.Manifest, 'permissions'> & {
  permissions: string[];
};

type ChromePreferences = {
  extensions: {
    settings: Record<
      string,
      {
        creation_flags: number;
        disable_reasons: number[];
        location: number;
        manifest: ProbeManifest;
        path: string;
        state: number;
      }
    >;
  };
};

type Options = {
  hostPermissions: string[];
  minimumChromeVersion: string;
  permissions: string[];
};

const execFileAsync = promisify(execFile);

async function getExtension(page: Page, extensionId: string) {
  const extensions = await page.evaluate<ExtensionInfo[]>(
    'chrome.developerPrivate.getExtensionsInfo({ includeDisabled: true })',
  );
  return extensions.find(({ id }) => id === extensionId);
}

async function waitForVersion(
  page: Page,
  extensionId: string,
  version: string,
): Promise<ExtensionInfo> {
  await expect
    .poll(async () => (await getExtension(page, extensionId))?.version)
    .toBe(version);
  return (await getExtension(page, extensionId)) as ExtensionInfo;
}

/**
 * Run the real signed CRX updater without auto-consent or enterprise policy.
 *
 * The baseline uses a seeded ordinary installed-extension profile because CDP
 * cannot automate Chrome's native signed-CRX install prompt. The subsequent
 * updates use Chrome's updater, signature checks, and permission checks. A
 * new-warning negative control confirms that the harness cannot silently
 * approve permission increases. Production Web Store rollout remains a
 * separate release smoke test.
 *
 * @param options - The actual candidate manifest's permission declarations.
 * @param options.hostPermissions - Existing host grants, unchanged by DNR.
 * @param options.minimumChromeVersion - Minimum version required by the candidate.
 * @param options.permissions - Candidate APIs, including DNR with host access.
 * @returns Installed extension states and actual CRX downloads.
 */
export async function runSignedExtensionUpdateProbe({
  hostPermissions,
  minimumChromeVersion,
  permissions,
}: Options) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mm-signed-update-'));
  const profile = path.join(directory, 'profile');
  const privateKeyPath = path.join(directory, 'signing-key.pem');
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const publicKeyBytes = publicKey.export({ type: 'spki', format: 'der' });
  const extensionId = createHash('sha256')
    .update(publicKeyBytes)
    .digest('hex')
    .slice(0, 32)
    .replace(/[0-9a-f]/gu, (digit) =>
      String.fromCharCode(97 + parseInt(digit, 16)),
    );
  await writeFile(
    privateKeyPath,
    privateKey.export({ type: 'pkcs8', format: 'pem' }),
  );

  let updateVersion = '2.0';
  let serverOrigin = '';
  const downloads: string[] = [];
  const crxFiles = new Map<string, Buffer>();
  const server = createServer((request, response) => {
    const requestPath = request.url?.split('?')[0];
    if (requestPath === '/update.xml') {
      response.writeHead(200, { 'Content-Type': 'text/xml' });
      response.end(`<?xml version="1.0" encoding="UTF-8"?>
        <gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
          <app appid="${extensionId}">
            <updatecheck codebase="${serverOrigin}/${updateVersion}.crx" version="${updateVersion}" />
          </app>
        </gupdate>`);
      return;
    }
    const crx = crxFiles.get(requestPath ?? '');
    if (crx && requestPath) {
      downloads.push(requestPath);
      response.writeHead(200, {
        'Content-Type': 'application/x-chrome-extension',
      });
      response.end(crx);
      return;
    }
    response.writeHead(404);
    response.end();
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('The signed-update server did not bind a TCP port');
  }
  serverOrigin = `http://127.0.0.1:${address.port}`;
  let context: BrowserContext | undefined;

  const pack = async (version: string, apiPermissions: string[]) => {
    const extensionDirectory = path.join(directory, version);
    await mkdir(extensionDirectory);
    const manifest: ProbeManifest = {
      manifest_version: 3,
      name: 'Network policy signed update regression',
      version,
      key: publicKeyBytes.toString('base64'),
      permissions: apiPermissions,
      host_permissions: hostPermissions,
      minimum_chrome_version: minimumChromeVersion,
      background: { service_worker: 'background.js' },
      update_url: `${serverOrigin}/update.xml`,
    };
    if (version !== '1.0') {
      manifest.declarative_net_request = {
        rule_resources: [
          { id: 'network_policy_default', enabled: true, path: 'rules.json' },
        ],
      };
      await writeFile(
        path.join(extensionDirectory, 'rules.json'),
        JSON.stringify(createBlockedNetworkPolicyRules(extensionId)),
      );
    }
    await writeFile(
      path.join(extensionDirectory, 'manifest.json'),
      JSON.stringify(manifest),
    );
    await writeFile(
      path.join(extensionDirectory, 'background.js'),
      'chrome.runtime.onInstalled.addListener(() => {});',
    );
    await execFileAsync(chromium.executablePath(), [
      '--no-sandbox',
      '--headless=new',
      `--user-data-dir=${path.join(directory, `pack-profile-${version}`)}`,
      `--pack-extension=${extensionDirectory}`,
      `--pack-extension-key=${privateKeyPath}`,
    ]);
    crxFiles.set(
      `/${version}.crx`,
      await readFile(`${extensionDirectory}.crx`),
    );
    return manifest;
  };

  const launch = async (loadBaseline = false) => {
    context = await chromium.launchPersistentContext(profile, {
      headless: false,
      // Playwright normally disables the extension updater. Leave it active:
      // these tests must download and verify signed CRXs, not reload unpacked JS.
      ignoreDefaultArgs: [
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-component-update',
      ],
      args: [
        '--headless=new',
        '--no-sandbox',
        '--extension-updater-test-request',
        ...(loadBaseline
          ? [
              `--disable-extensions-except=${path.join(directory, '1.0')}`,
              `--load-extension=${path.join(directory, '1.0')}`,
            ]
          : []),
      ],
    });
    const page = await context.newPage();
    await page.goto('chrome://extensions/');
    return page;
  };

  try {
    const baselineManifest = await pack(
      '1.0',
      permissions.filter(
        (permission) => permission !== 'declarativeNetRequestWithHostAccess',
      ),
    );
    await pack('2.0', permissions);
    await pack('3.0', [...permissions, 'downloads']);

    let page = await launch(true);
    await waitForVersion(page, extensionId, '1.0');
    await context?.close();
    const installedDirectory = path.join(
      profile,
      'Default',
      'Extensions',
      extensionId,
      '1.0_0',
    );
    await mkdir(installedDirectory, { recursive: true });
    await cp(path.join(directory, '1.0'), installedDirectory, {
      recursive: true,
    });
    const preferencesPath = path.join(profile, 'Default', 'Preferences');
    const preferences = JSON.parse(
      await readFile(preferencesPath, 'utf8'),
    ) as ChromePreferences;
    Object.assign(preferences.extensions.settings[extensionId], {
      // INTERNAL (1), not UNPACKED/COMMAND_LINE or enterprise force-installed.
      location: 1,
      path: `${extensionId}/1.0_0`,
      creation_flags: 0,
      manifest: baselineManifest,
      state: 1,
      disable_reasons: [],
    });
    await writeFile(preferencesPath, JSON.stringify(preferences));

    page = await launch();
    const baseline = await waitForVersion(page, extensionId, '1.0');
    await page.evaluate('chrome.developerPrivate.autoUpdate()');
    const candidate = await waitForVersion(page, extensionId, '2.0');
    updateVersion = '3.0';
    await page.evaluate('chrome.developerPrivate.autoUpdate()');
    const negativeControl = await waitForVersion(page, extensionId, '3.0');
    return { baseline, candidate, negativeControl, downloads };
  } finally {
    await context?.close();
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
}
