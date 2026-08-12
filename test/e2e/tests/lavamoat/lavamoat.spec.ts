import { strict as assert } from 'assert';
import { withFixtures } from '../../helpers';
import { PAGES, Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { isManifestV3 } from '../../../../shared/lib/mv3.utils';

const lavamoatTestScript = 'return globalThis.stateHooks.hasConsoleAccess();';

describe('lavamoat', function (this: Mocha.Suite) {
  it('the UI environment enforces the lavamoat policy', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate(PAGES.HOME);
        assert.strictEqual(
          await driver.executeScript(lavamoatTestScript),
          false,
          'Expected LavaMoat to deny console access to @metamask/dummy-package in the UI',
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
          // TODO: Offscreen support
          // await driver.navigate(PAGES.OFFSCREEN);
          // await assert.rejects(
          //   driver.executeScript(lavamoatErrorScript),
          //  lavamoatErrorPattern,
          // );

          await driver.navigate(PAGES.HOME);
          assert.strictEqual(
            await driver.executeScriptInExtensionServiceWorker(
              lavamoatTestScript,
            ),
            false,
            'Expected LavaMoat to deny console access to @metamask/dummy-package in the service worker',
          );
        } else {
          await driver.navigate(PAGES.BACKGROUND);
          assert.strictEqual(
            await driver.executeScript(lavamoatTestScript),
            false,
            'Expected LavaMoat to deny console access to @metamask/dummy-package in the background page',
          );
        }
      },
    );
  });
});
