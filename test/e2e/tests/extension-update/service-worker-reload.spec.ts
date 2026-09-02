import { Browser } from 'selenium-webdriver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import type { Driver } from '../../webdriver/driver';

// Service-worker restarts normally finish in a few seconds, but slower CI hosts
// need additional headroom before the test is considered failed.
const ENTRY_POINT_ENABLEMENT_TIMEOUT_MS = 30_000;

// Check often enough to observe recovery promptly without tight-looping CDP
// calls while Chrome restarts the service worker.
const ENTRY_POINT_ENABLEMENT_POLL_INTERVAL_MS = 250;

async function areEntryPointsEnabled(driver: Driver): Promise<boolean> {
  try {
    return (await driver.executeScriptInExtensionServiceWorker(`
      if (globalThis.__reloadExtensionAfterProbe === true) {
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

async function waitForEntryPoints(driver: Driver): Promise<void> {
  await driver.waitUntil(() => areEntryPointsEnabled(driver), {
    interval: ENTRY_POINT_ENABLEMENT_POLL_INTERVAL_MS,
    timeout: ENTRY_POINT_ENABLEMENT_TIMEOUT_MS,
  });
}

describe('Post-update reload coordination', function () {
  it('restores browser entry points after a recovery reload', async function () {
    if (process.env.SELENIUM_BROWSER !== Browser.CHROME) {
      this.skip();
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await waitForEntryPoints(driver);
        await driver.executeScriptInExtensionServiceWorker(
          'globalThis.__reloadExtensionAfterProbe = true;',
        );
        await waitForEntryPoints(driver);
      },
    );
  });
});
