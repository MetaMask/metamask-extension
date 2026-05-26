import { Buffer } from 'node:buffer';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { firefox } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { isHeadless } from '../../../helpers/env';
import { getOrBuildXpi } from '../../helpers/xpi';

const METAMASK_GECKO_ID = 'webextension@metamask.io';
const DEFAULT_FIREFOX_RDP_PORT = 6023;
const DEFAULT_FIREFOX_EXTENSION_DIR = path.join(
  process.cwd(),
  'dist',
  'firefox',
);

const ABOUT_DEBUGGING_URL = 'about:debugging#/runtime/this-firefox';
const PATCH_MARKER = '// --- MetaMask Firefox Harness Patch ---';

export type FirefoxPolicySetup = {
  policiesPath: string;
  xpiPath: string;
  cleanup: () => Promise<void>;
};

type PrepareMetaMaskFirefoxPoliciesOptions = {
  extensionDirectory?: string;
  extensionId?: string;
};

export async function prepareMetaMaskFirefoxPolicies(
  options: PrepareMetaMaskFirefoxPoliciesOptions = {},
): Promise<FirefoxPolicySetup> {
  const extensionDirectory =
    options.extensionDirectory ?? path.join(process.cwd(), 'dist', 'firefox');
  const extensionId = options.extensionId ?? 'webextension@metamask.io';
  const xpiPath = await getOrBuildXpi(extensionDirectory);

  const policyDirectory = await mkdtemp(
    path.join(os.tmpdir(), 'mm-firefox-policies-'),
  );
  const policiesPath = path.join(policyDirectory, 'policies.json');

  const policies = {
    policies: {
      ExtensionSettings: {
        [extensionId]: {
          // Mozilla policy schema keys are snake_case and cannot be renamed.
          // eslint-disable-next-line @typescript-eslint/naming-convention
          installation_mode: 'force_installed',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          install_url: pathToFileURL(xpiPath).href,
        },
      },
    },
  };

  await writeFile(policiesPath, JSON.stringify(policies, null, 2), 'utf-8');

  return {
    policiesPath,
    xpiPath,
    cleanup: async () => {
      await rm(policyDirectory, { recursive: true, force: true });
    },
  };
}

export async function findMetaMaskInternalUuid(
  page: Page,
  extensionId: string,
  timeoutMs = 15000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      await page.goto(ABOUT_DEBUGGING_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 5000,
      });
    } catch {
      await page.waitForTimeout(500);
      continue;
    }
    const bodyText = await page.locator('body').innerText();

    if (!bodyText.includes(extensionId)) {
      await page.waitForTimeout(500);
      continue;
    }

    const scopedUuidMatch = bodyText.match(
      new RegExp(
        `${extensionId}[\\s\\S]*?UUID\\s+([0-9a-f]{8}-[0-9a-f-]{27})`,
        'iu',
      ),
    );
    if (scopedUuidMatch?.[1]) {
      return scopedUuidMatch[1];
    }

    const genericUuidMatch = bodyText.match(
      /UUID\s+([0-9a-f]{8}-[0-9a-f-]{27})/iu,
    );
    if (genericUuidMatch?.[1]) {
      return genericUuidMatch[1];
    }

    await page.waitForTimeout(500);
  }

  throw new Error(
    `Failed to resolve UUID for ${extensionId} from ${ABOUT_DEBUGGING_URL} within ${timeoutMs}ms.`,
  );
}

export async function findMetaMaskInternalUuidFromProfile(
  profileDirectory: string,
  extensionId: string,
  timeoutMs = 15000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  const prefsPath = path.join(profileDirectory, 'prefs.js');

  while (Date.now() < deadline) {
    try {
      const prefsContent = await readFile(prefsPath, 'utf-8');
      const mappingMatch = prefsContent.match(
        /user_pref\("extensions\.webextensions\.uuids",\s*"(.+)"\);/u,
      );

      if (!mappingMatch?.[1]) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }

      const escapedJson = mappingMatch[1]
        .replace(/\\"/gu, '"')
        .replace(/\\\\/gu, '\\');
      const parsed = JSON.parse(escapedJson) as Record<string, string>;
      const uuid = parsed[extensionId];

      if (uuid) {
        return uuid;
      }
    } catch {
      // Ignore read/parse race conditions while Firefox is still writing prefs.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(
    `Failed to resolve UUID for ${extensionId} from ${prefsPath} within ${timeoutMs}ms.`,
  );
}

/**
 * Patch Playwright's bundled Firefox to make extension pages reachable by Juggler.
 * This mirrors the experimental approach used by other extension projects.
 */
export async function ensurePatchedPlaywrightFirefox(): Promise<void> {
  const executablePath = firefox.executablePath();
  const omniPathCandidates = [
    path.join(path.dirname(executablePath), 'omni.ja'),
    path.join(path.dirname(path.dirname(executablePath)), 'omni.ja'),
    path.join(path.dirname(path.dirname(executablePath)), 'Resources/omni.ja'),
    path.join(
      path.dirname(path.dirname(path.dirname(executablePath))),
      'Contents/Resources/omni.ja',
    ),
  ];
  const omniPath = omniPathCandidates.find((candidatePath) =>
    existsSync(candidatePath),
  );

  if (!omniPath) {
    throw new Error(
      `Could not locate omni.ja near Firefox executable at ${executablePath}`,
    );
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'mm-firefox-patch-'));

  try {
    execFileSync(
      'unzip',
      ['-q', omniPath, 'chrome/juggler/content/content/JugglerFrameChild.jsm'],
      { cwd: tempDir },
    );

    const jugglerChildPath = path.join(
      tempDir,
      'chrome/juggler/content/content/JugglerFrameChild.jsm',
    );

    const jugglerChild = await readFile(jugglerChildPath, 'utf-8');
    if (jugglerChild.includes(PATCH_MARKER)) {
      return;
    }

    const patchedJugglerChild = jugglerChild.replace(
      'moz-extension://',
      `moz-extension-DISABLED:// ${PATCH_MARKER}`,
    );
    await writeFile(jugglerChildPath, patchedJugglerChild, 'utf-8');

    execFileSync(
      'zip',
      [
        '-q',
        '-u',
        omniPath,
        'chrome/juggler/content/content/JugglerFrameChild.jsm',
      ],
      { cwd: tempDir },
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

type InstallTemporaryAddonOptions = {
  port: number;
  addonPath: string;
  host?: string;
  timeoutMs?: number;
};

type RdpMessage = {
  addonsActor?: string;
  addon?: { id?: string };
  error?: string;
};

/**
 * Installs an unpacked Firefox extension via Remote Debugging Protocol.
 * This avoids enterprise-policy signing requirements for local unsigned builds.
 *
 * @param options - RDP install options.
 * @param options.port - Local TCP port the Firefox RDP server listens on.
 * @param options.addonPath - Filesystem path to the unpacked extension directory or an .xpi file.
 * @param options.host - Host to connect to. Defaults to `127.0.0.1`.
 * @param options.timeoutMs - Install timeout in milliseconds. Defaults to 15000.
 */
export async function installTemporaryAddonViaRdp({
  port,
  addonPath,
  host = '127.0.0.1',
  timeoutMs = 15000,
}: InstallTemporaryAddonOptions): Promise<string | null> {
  const resolvedAddonPath = await resolveAddonInstallPath(addonPath);

  return await new Promise<string | null>((resolve, reject) => {
    const socket = net.connect({ port, host });
    let finished = false;
    let installedAddonId: string | null = null;
    let remainingBytes = 0;
    const buffers: Buffer[] = [];

    const finalize = (error?: Error) => {
      if (finished) {
        return;
      }
      finished = true;
      socket.destroy();
      if (error) {
        reject(error);
      } else {
        resolve(installedAddonId);
      }
    };

    const timer = setTimeout(() => {
      finalize(
        new Error(`Timed out installing addon via RDP after ${timeoutMs}ms`),
      );
    }, timeoutMs);

    const sendMessage = (data: Record<string, unknown>) => {
      const raw = Buffer.from(JSON.stringify(data));
      socket.write(`${raw.length}:${raw.toString()}`);
    };

    const onMessage = (message: RdpMessage) => {
      if (message.addonsActor) {
        sendMessage({
          to: message.addonsActor,
          type: 'installTemporaryAddon',
          addonPath: resolvedAddonPath,
        });
        return;
      }

      if (message.addon) {
        installedAddonId = message.addon.id ?? null;
        clearTimeout(timer);
        finalize();
        return;
      }

      if (message.error) {
        clearTimeout(timer);
        finalize(new Error(`RDP addon install failed: ${message.error}`));
      }
    };

    socket.once('error', (error) => {
      clearTimeout(timer);
      finalize(error);
    });

    socket.once('connect', () => {
      sendMessage({ to: 'root', type: 'getRoot' });
    });

    socket.on('data', (chunk) => {
      let data = chunk;
      while (data.length > 0) {
        if (remainingBytes === 0) {
          const colonIndex = data.indexOf(':');
          buffers.push(data);
          if (colonIndex === -1) {
            return;
          }

          const headerBuffer = Buffer.concat(buffers);
          const headerColon = headerBuffer.indexOf(':');
          buffers.length = 0;
          remainingBytes = Number(
            headerBuffer.subarray(0, headerColon).toString(),
          );
          if (!Number.isFinite(remainingBytes)) {
            clearTimeout(timer);
            finalize(new Error('Invalid RDP frame length'));
            return;
          }
          data = headerBuffer.subarray(headerColon + 1);
        }

        if (data.length < remainingBytes) {
          remainingBytes -= data.length;
          buffers.push(data);
          return;
        }

        const payloadBytes = remainingBytes;
        buffers.push(data.subarray(0, payloadBytes));
        const payload = Buffer.concat(buffers).toString();
        buffers.length = 0;
        remainingBytes = 0;

        const parsed = JSON.parse(payload) as RdpMessage;
        onMessage(parsed);
        data = data.subarray(payloadBytes);
      }
    });
  });
}

async function resolveAddonInstallPath(addonPath: string): Promise<string> {
  if (path.extname(addonPath).toLowerCase() === '.xpi') {
    return addonPath;
  }

  try {
    const addonStats = await stat(addonPath);
    if (addonStats.isDirectory()) {
      return await getOrBuildXpi(addonPath);
    }
  } catch {
    // Let Firefox return the path error if this is an invalid path.
  }

  return addonPath;
}

export type FirefoxHarnessOptions = {
  extensionDirectory?: string;
  headless?: boolean;
  rdpPort?: number;
};

export type FirefoxHarnessSetup = {
  context: BrowserContext;
  page: Page;
  extensionId: string;
  extensionUrl: string;
  cleanup: () => Promise<void>;
};

/**
 * Launches the Playwright-bundled Firefox with MetaMask installed via the
 * Remote Debugging Protocol and returns the active context, the home page,
 * and the resolved `moz-extension://<uuid>` URL.
 *
 * Mirrors the shape of {@link launchMetaMaskChromeExtension} so the
 * `buildPlaywrightDriver` factory can dispatch between browsers.
 *
 * @param options - Harness options.
 */
export async function launchMetaMaskFirefoxExtension(
  options: FirefoxHarnessOptions = {},
): Promise<FirefoxHarnessSetup> {
  const extensionDirectory =
    options.extensionDirectory ?? DEFAULT_FIREFOX_EXTENSION_DIR;
  const rdpPort = options.rdpPort ?? DEFAULT_FIREFOX_RDP_PORT;
  // Resolution order matches chrome-extension-harness.ts: explicit option →
  // PLAYWRIGHT_HEADLESS env var → CI detection.
  const headless =
    options.headless ?? (isHeadless('PLAYWRIGHT') || Boolean(process.env.CI));

  if (!existsSync(path.join(extensionDirectory, 'manifest.json'))) {
    throw new Error(
      `[Firefox E2E] No manifest.json found at ${extensionDirectory}. ` +
        `Run \`yarn build:test:mv2\` first.`,
    );
  }

  await ensurePatchedPlaywrightFirefox();

  const userDataDir = await mkdtemp(path.join(os.tmpdir(), 'mm-pw-firefox-'));

  const context = await firefox.launchPersistentContext(userDataDir, {
    headless,
    args: ['-start-debugger-server', String(rdpPort)],
    firefoxUserPrefs: {
      'devtools.debugger.remote-enabled': true,
      'devtools.debugger.prompt-connection': false,
    },
  });

  try {
    await installTemporaryAddonViaRdp({
      port: rdpPort,
      addonPath: extensionDirectory,
    });

    const extensionUuid = await findMetaMaskInternalUuidFromProfile(
      userDataDir,
      METAMASK_GECKO_ID,
      30_000,
    );
    const extensionUrl = `moz-extension://${extensionUuid}`;

    const [page] = context.pages();
    if (!page) {
      throw new Error(
        '[Firefox E2E] launchPersistentContext returned no initial page',
      );
    }

    return {
      context,
      page,
      extensionId: extensionUuid,
      extensionUrl,
      cleanup: async () => {
        await context.close().catch(() => undefined);
        await rm(userDataDir, { recursive: true, force: true }).catch(
          () => undefined,
        );
      },
    };
  } catch (error) {
    await context.close().catch(() => undefined);
    await rm(userDataDir, { recursive: true, force: true }).catch(
      () => undefined,
    );
    throw error;
  }
}
