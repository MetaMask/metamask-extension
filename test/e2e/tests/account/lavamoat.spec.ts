import { strict as assert } from 'assert';
import { withFixtures } from '../../helpers';
import { PAGES, Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { isManifestV3 } from '../../../../shared/lib/mv3.utils';

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
          driver.executeScript('globalThis.stateHooks.throwLavamoatError();'),
          /Cannot read properties of undefined \(reading 'log'\)/u,
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
          await driver.navigate(PAGES.HOME);
          await assert.rejects(
            driver.executeScriptInExtensionServiceWorker(
              'globalThis.stateHooks.throwLavamoatError();',
            ),
            /Cannot read properties of undefined \(reading 'log'\)/u,
          );
        } else {
          await driver.navigate(PAGES.BACKGROUND);
          await assert.rejects(
            driver.executeScript('globalThis.stateHooks.throwLavamoatError();'),
            /Cannot read properties of undefined \(reading 'log'\)/u,
          );
        }
      },
    );
  });
});
