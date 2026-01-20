import type { BrowserContext, Page } from '@playwright/test';

export type ExtensionIdResolverDeps = {
  context: BrowserContext;
  log: {
    info: (message: string) => void;
    warn: (message: string, error?: unknown) => void;
  };
};

export async function resolveExtensionId({
  context,
  log,
}: ExtensionIdResolverDeps): Promise<string | undefined> {
  const fromWorker = await getExtensionIdFromServiceWorker(context, log);
  if (fromWorker) {
    return fromWorker;
  }

  log.info(
    'Service worker discovery failed, falling back to chrome://extensions',
  );
  return getExtensionIdFromExtensionsPage(context, log);
}

function extractExtensionIdFromUrl(url: string): string | undefined {
  const match = url.match(/chrome-extension:\/\/([a-z]{32})\//u);
  return match ? match[1] : undefined;
}

async function getExtensionIdFromServiceWorker(
  context: BrowserContext,
  log: ExtensionIdResolverDeps['log'],
): Promise<string | undefined> {
  try {
    const existingWorkers = context.serviceWorkers();
    for (const worker of existingWorkers) {
      const extensionId = extractExtensionIdFromUrl(worker.url());
      if (extensionId) {
        log.info(
          `Found extension ID from existing service worker: ${extensionId}`,
        );
        return extensionId;
      }
    }

    const worker = await Promise.race([
      context.waitForEvent('serviceworker', { timeout: 10000 }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)),
    ]);

    if (worker && typeof worker !== 'number') {
      const extensionId = extractExtensionIdFromUrl(worker.url());
      if (extensionId) {
        log.info(`Found extension ID from new service worker: ${extensionId}`);
        return extensionId;
      }
    }
  } catch (error) {
    log.warn('Service worker extension ID discovery failed:', error);
  }

  return undefined;
}

async function getExtensionIdFromExtensionsPage(
  context: BrowserContext,
  log: ExtensionIdResolverDeps['log'],
  maxRetries = 3,
): Promise<string | undefined> {
  const page = await ensurePage(context);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await page.goto('chrome://extensions');
      await page.waitForLoadState('domcontentloaded');
      await waitForExtensionsPageReady(page);

      const extensionId = await page.evaluate(() => {
        const extensionsManager = document.querySelector('extensions-manager');
        if (!extensionsManager?.shadowRoot) {
          return undefined;
        }

        const itemList = extensionsManager.shadowRoot.querySelector(
          'extensions-item-list',
        );
        if (!itemList?.shadowRoot) {
          return undefined;
        }

        const items = itemList.shadowRoot.querySelectorAll('extensions-item');

        for (const item of items) {
          const nameEl = item.shadowRoot?.querySelector('#name');
          const name = nameEl?.textContent || '';
          if (name.includes('MetaMask')) {
            return item.getAttribute('id') || undefined;
          }
        }

        return undefined;
      });

      if (extensionId) {
        return extensionId;
      }

      if (attempt < maxRetries) {
        log.warn(
          `MetaMask extension not found (attempt ${attempt}/${maxRetries}), retrying...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      if (attempt < maxRetries) {
        log.warn(
          `Error getting extension ID (attempt ${attempt}/${maxRetries}):`,
          error,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        throw new Error(
          `Failed to get MetaMask extension ID after ${maxRetries} attempts. ` +
            'Ensure the extension is built at the configured extension path. ' +
            'Run: yarn build:test',
        );
      }
    }
  }

  return undefined;
}

async function waitForExtensionsPageReady(
  page: Page,
  maxAttempts = 20,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const isReady = await page.evaluate(() => {
      const extensionsManager = document.querySelector('extensions-manager');
      if (!extensionsManager?.shadowRoot) {
        return false;
      }

      const itemList = extensionsManager.shadowRoot.querySelector(
        'extensions-item-list',
      );
      if (!itemList?.shadowRoot) {
        return false;
      }

      const items = itemList.shadowRoot.querySelectorAll('extensions-item');
      return items.length > 0;
    });

    if (isReady) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(
    `chrome://extensions page did not load extensions within ${maxAttempts * 100}ms. ` +
      'The shadow DOM structure was not fully populated. ' +
      'This may indicate a Chrome version incompatibility or slow system.',
  );
}

async function ensurePage(context: BrowserContext): Promise<Page> {
  const pages = context.pages();
  if (pages[0]) {
    return pages[0];
  }

  return context.newPage();
}
