import { Browser } from 'selenium-webdriver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import type { Driver } from '../../webdriver/driver';

const WORKER_RESTART_TIMEOUT_MS = 30_000;

async function isWorkerReady(driver: Driver): Promise<boolean> {
  try {
    return (await driver.executeScriptInExtensionServiceWorker(`
      if (globalThis.__updateTestWorkerMarker === true) {
        // Reload after this probe returns so its CDP response is not discarded.
        globalThis.setTimeout(() => chrome.runtime.reload());
        return false;
      }
      const sidePanel = await chrome.sidePanel.getOptions({});
      return await chrome.action.isEnabled() &&
        sidePanel.enabled === true &&
        sidePanel.path === 'sidepanel.html';
    `)) as boolean;
  } catch {
    // The worker and its APIs can be briefly unavailable while Chrome starts it.
    return false;
  }
}

async function waitForReadyWorker(driver: Driver): Promise<void> {
  await driver.waitUntil(() => isWorkerReady(driver), {
    interval: 250,
    timeout: WORKER_RESTART_TIMEOUT_MS,
  });
}

describe('Extension service-worker lifecycle', function () {
  it('restores browser entry points after an extension reload', async function () {
    if (process.env.SELENIUM_BROWSER !== Browser.CHROME) {
      this.skip();
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await waitForReadyWorker(driver);
        await driver.executeScriptInExtensionServiceWorker(
          'globalThis.__updateTestWorkerMarker = true;',
        );
        await waitForReadyWorker(driver);
      },
    );
  });
});
