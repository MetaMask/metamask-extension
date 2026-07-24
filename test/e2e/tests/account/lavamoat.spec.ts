import { strict as assert } from 'assert';
import { Browser } from 'selenium-webdriver';
import { withFixtures } from '../../helpers';
import { PAGES, Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { isManifestV3 } from '../../../../shared/lib/mv3.utils';

const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

const lavamoatErrorScript = 'globalThis.stateHooks.throwLavamoatError();';

const lavamoatErrorPattern = isFirefox
  ? /can't access property "log", console is undefined/u
  : /Cannot read properties of undefined \(reading 'log'\)/u;

describe('lavamoat', function (this: Mocha.Suite) {
  it('the UI environment enforces the lavamoat policy', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate(PAGES.HOME);
        await assert.rejects(
          driver.executeScript(lavamoatErrorScript),
          lavamoatErrorPattern,
        );
      },
    );
  });

  it('the background environment enforces the lavamoat policy', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        if (isManifestV3) {
          await driver.navigate(PAGES.OFFSCREEN);
          await assert.rejects(
            driver.executeScript(lavamoatErrorScript),
            lavamoatErrorPattern,
          );

          await driver.navigate(PAGES.HOME);
          await assert.rejects(
            driver.executeScriptInExtensionServiceWorker(lavamoatErrorScript),
            lavamoatErrorPattern,
          );
        } else {
          await driver.navigate(PAGES.BACKGROUND);
          await assert.rejects(
            driver.executeScript(lavamoatErrorScript),
            lavamoatErrorPattern,
          );
        }
      },
    );
  });
});
