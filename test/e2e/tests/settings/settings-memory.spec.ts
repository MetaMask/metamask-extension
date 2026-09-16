import { Browser } from 'selenium-webdriver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import SettingsMemoryPage from '../../page-objects/pages/settings/settings-memory-page';
import { Driver } from '../../webdriver/driver';

// Requires the production-mode test build (yarn build:test), with Snow enabled.
// A real browser is necessary to exercise Snow and collect detached DOM nodes.
describe('Settings memory', function () {
  it('collects detached Settings roots and images after navigation', async function () {
    // Forced garbage collection uses Chrome's DevTools Protocol.
    if (process.env.SELENIUM_BROWSER !== Browser.CHROME) {
      this.skip();
    }
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const memory = new SettingsMemoryPage(driver);
        await memory.installProbe();
        await login(driver);

        for (let iteration = 0; iteration < 3; iteration++) {
          await memory.openSettings();
          await memory.captureElements();
          await memory.closeSettings();
        }

        await memory.checkElementsAreCollected(3);
      },
    );
  });
});
