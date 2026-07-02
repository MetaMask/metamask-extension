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
  /**
   * Optional mock-server port. Defaults to 8000 (matches Selenium and
   * `helpers.js`). All browser network traffic is routed through this
   * proxy so PW tests see the same canned mockttp responses as Selenium.
   */
  proxyPort?: number;
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
 * Resolves the mockttp proxy URL the browser should route requests through.
 * Mirrors the Selenium `chrome.js` / `firefox.js` `getProxyServer` helpers
 * so PW tests see the same canned responses as Selenium ones.
 *
 * Order of precedence: explicit `proxyPort` arg → `SELENIUM_HTTPS_PROXY`
 * env var → `http://127.0.0.1:8000` (matches `helpers.js` `mockServer.start(8000)`).
 *
 * @param proxyPort - Optional explicit mock-server port.
 */
function resolveMockServerProxy(proxyPort?: number): string {
  if (proxyPort) {
    return `http://127.0.0.1:${proxyPort}`;
  }
  return process.env.SELENIUM_HTTPS_PROXY ?? 'http://127.0.0.1:8000';
}

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

  // Resolution order: explicit option → PLAYWRIGHT_HEADLESS env var → CI
  // detection. Locally both are unset, so dev gets a headed window.
  const headless =
    options.headless ?? (isHeadless('PLAYWRIGHT') || Boolean(process.env.CI));

  // CRITICAL: Playwright's `headless: true` does two things in 1.54.x:
  //  (1) selects the `chromium-headless-shell` binary, and
  //  (2) adds the legacy `--headless` flag.
  // The `chromium-headless-shell` binary is a stripped-down build that
  // does NOT support extensions — MV3 service workers never attach and
  // any navigation to `chrome-extension://<id>/...` fails with
  // `net::ERR_ABORTED`. To mirror Selenium's working behavior (full
  // Chrome + `--headless=new`), we tell Playwright `headless: false` so
  // it picks the full Chromium binary, then opt into headless rendering
  // ourselves via the explicit `--headless=new` arg. This matches the
  // `chrome.js` Selenium driver one-for-one.
  if (headless) {
    args.push('--headless=new');
  }

  // Route all browser traffic through the e2e mock server (mockttp on
  // 127.0.0.1:8000 by default). Without this, requests bypass the mock
  // server entirely, real backends get called, fixtures that depend on
  // canned responses (e.g. terms-of-use acceptance, account discovery,
  // price feeds) silently fail, and dependent UI never transitions.
  // Mirrors `--proxy-server=...` + `acceptInsecureCerts: true` from
  // `chrome.js`.
  //
  // The `bypass` list is critical and easy to miss. Selenium uses
  // Chromium's `--proxy-server` CLI flag, which has an *implicit*
  // loopback bypass (per Chromium proxy docs: `localhost`, `*.localhost`,
  // `127.0.0.1`, `[::1]` are auto-bypassed unless `<-loopback>` is set).
  // Playwright's `proxy:` option configures the proxy via internal API
  // and does NOT inherit that implicit bypass — every loopback request
  // ends up forwarded to mockttp. That breaks at least three things:
  //   1. the e2e fixture server (`http://localhost:12345/state.json`)
  //      returns mockttp's default response → the extension thinks it's
  //      a fresh install → the test lands on onboarding;
  //   2. the local Anvil RPC (`127.0.0.1:8545`) never reaches Anvil;
  //   3. the WS servers + test dapp (`localhost:8080-8090`) misbehave.
  // The bypass list below restores Selenium's behavior exactly.
  const proxyServer = resolveMockServerProxy(options.proxyPort);

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args,
    acceptDownloads: true,
    downloadsPath: downloadsDir,
    viewport: null,
    proxy: {
      server: proxyServer,
      bypass: 'localhost, 127.0.0.1',
    },
    ignoreHTTPSErrors: true,
  });

  // Wait for the MV3 service worker before returning so the first
  // `chrome-extension://<id>/...` navigation doesn't race the worker's
  // attachment. The manifest-key derivation gives us the correct ID even
  // before the worker is up, but the URL isn't serviceable until the
  // worker registers — surfacing as `net::ERR_ABORTED` downstream. This
  // wait is cheap when the worker is already up; if it times out we
  // fall through to the manifest ID and let the caller see the navigation
  // failure with the real error message.
  const serviceWorkerExtensionId =
    await resolveExtensionIdFromServiceWorker(context);

  const extensionId =
    computeExtensionIdFromManifest(extensionDirectory) ??
    serviceWorkerExtensionId ??
    (await resolveExtensionIdFromContextPages(context));

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
