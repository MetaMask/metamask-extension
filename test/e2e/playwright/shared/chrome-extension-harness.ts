import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { isHeadless } from '../../../helpers/env';

export type ChromeHarnessOptions = {
  extensionDirectory?: string;
  headless?: boolean;
  /**
   * Optional extra Chromium command-line arguments. Useful for proxy
   * configuration in conjunction with the e2e mock server.
   */
  extraArgs?: string[];
};

export type ChromeHarnessSetup = {
  context: BrowserContext;
  page: Page;
  extensionId: string;
  extensionUrl: string;
  cleanup: () => Promise<void>;
};

const DEFAULT_EXTENSION_DIR = path.join(process.cwd(), 'dist', 'chrome');

/**
 * Launches Chromium with the MetaMask MV3 extension loaded via
 * `launchPersistentContext` + `--load-extension`, resolves the extension ID
 * (preferring the deterministic manifest-`key` derivation, falling back to
 * service-worker discovery), and returns the context + initial page.
 *
 * @param options - Harness options.
 * @returns Harness setup with cleanup function.
 */
export async function launchMetaMaskChromeExtension(
  options: ChromeHarnessOptions = {},
): Promise<ChromeHarnessSetup> {
  const extensionDirectory =
    options.extensionDirectory ?? DEFAULT_EXTENSION_DIR;
  if (!existsSync(path.join(extensionDirectory, 'manifest.json'))) {
    throw new Error(
      `[Chrome E2E] No manifest.json found at ${extensionDirectory}. ` +
        `Run \`yarn build:test\` first.`,
    );
  }

  const userDataDir = await mkdtemp(path.join(os.tmpdir(), 'mm-chrome-e2e-'));
  const downloadsDir = path.join(process.cwd(), 'test-artifacts', 'downloads');

  const args = [
    `--disable-extensions-except=${extensionDirectory}`,
    `--load-extension=${extensionDirectory}`,
    '--no-default-browser-check',
    '--no-first-run',
    '--disable-features=Translate',
    '--disable-component-update',
    '--disable-dev-shm-usage',
    ...(options.extraArgs ?? []),
  ];

  if (process.env.CI || process.env.CODESPACES) {
    args.push('--disable-gpu', '--no-sandbox');
  }

  // PW 1.34+ uses `--headless=new` automatically when `headless: true`,
  // which supports MV3 extensions. Don't push the flag manually — it
  // duplicates / confuses PW's internal handling.
  // Resolution order: explicit option → PLAYWRIGHT_HEADLESS env var → CI
  // detection. Locally, defaults to headed for developer ergonomics.
  const headless =
    options.headless ?? (isHeadless('PLAYWRIGHT') || Boolean(process.env.CI));

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless,
    args,
    acceptDownloads: true,
    downloadsPath: downloadsDir,
    viewport: null,
  });

  let extensionId =
    computeExtensionIdFromManifest(extensionDirectory) ??
    (await resolveExtensionIdFromServiceWorker(context));

  if (!extensionId) {
    extensionId = await resolveExtensionIdFromContextPages(context);
  }

  if (!extensionId) {
    await context.close().catch(() => undefined);
    await rm(userDataDir, { recursive: true, force: true }).catch(
      () => undefined,
    );
    throw new Error(
      '[Chrome E2E] Could not resolve MetaMask extension ID from manifest key, ' +
        'service worker, or extension pages.',
    );
  }

  // launchPersistentContext opens with a blank page already. Reuse it.
  const initialPage = context.pages()[0] ?? (await context.newPage());

  return {
    context,
    page: initialPage,
    extensionId,
    extensionUrl: `chrome-extension://${extensionId}`,
    cleanup: async () => {
      await context.close().catch(() => undefined);
      await rm(userDataDir, { recursive: true, force: true }).catch(
        () => undefined,
      );
    },
  };
}

/**
 * Computes the deterministic Chrome extension ID from the manifest's `key`
 * field (mirrors the Selenium Chrome driver). Returns null if the key is
 * absent or unreadable.
 *
 * @param extensionDirectory - Path to the unpacked extension directory.
 */
function computeExtensionIdFromManifest(
  extensionDirectory: string,
): string | null {
  try {
    const manifest = JSON.parse(
      readFileSync(path.join(extensionDirectory, 'manifest.json'), 'utf8'),
    );
    if (!manifest.key) {
      return null;
    }
    const keyBytes = Buffer.from(manifest.key, 'base64');
    const hash = createHash('sha256').update(keyBytes).digest('hex');
    return hash
      .slice(0, 32)
      .replace(/[0-9a-f]/gu, (character) =>
        String.fromCharCode(97 + parseInt(character, 16)),
      );
  } catch {
    return null;
  }
}

/**
 * Resolves the extension ID by waiting for the MV3 service worker URL of
 * the form `chrome-extension://<id>/...`. Times out at 10s.
 *
 * @param context - Playwright browser context.
 */
async function resolveExtensionIdFromServiceWorker(
  context: BrowserContext,
): Promise<string | null> {
  const existing = context.serviceWorkers();
  for (const worker of existing) {
    const match = worker.url().match(/chrome-extension:\/\/([a-z]+)\//u);
    if (match) {
      return match[1];
    }
  }
  return await new Promise<string | null>((resolve) => {
    const state: { timer: NodeJS.Timeout | null } = { timer: null };
    const listener = (worker: { url(): string }) => {
      const match = worker.url().match(/chrome-extension:\/\/([a-z]+)\//u);
      if (match) {
        if (state.timer) {
          clearTimeout(state.timer);
        }
        context.off('serviceworker', listener);
        resolve(match[1]);
      }
    };
    state.timer = setTimeout(() => {
      context.off('serviceworker', listener);
      resolve(null);
    }, 10_000);
    context.on('serviceworker', listener);
  });
}

/**
 * Fallback that scans existing extension pages (e.g. background page in
 * MV2 fallbacks, or auto-opened popups) for a `chrome-extension://<id>`
 * URL.
 *
 * @param context - Playwright browser context.
 */
async function resolveExtensionIdFromContextPages(
  context: BrowserContext,
): Promise<string | null> {
  for (const page of context.pages()) {
    const match = page.url().match(/chrome-extension:\/\/([a-z]+)\//u);
    if (match) {
      return match[1];
    }
  }
  return null;
}
