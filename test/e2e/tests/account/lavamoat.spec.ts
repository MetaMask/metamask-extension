import { strict as assert } from 'assert';
import { withFixtures } from '../../helpers';
import { PAGES, Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { isManifestV3 } from '../../../../shared/lib/mv3.utils';

type ThrowLavamoatErrorScriptResult = {
  message: string | null;
  name: string | null;
};

const throwLavamoatErrorScript = `
try {
  globalThis.stateHooks.throwLavamoatError();
  return {
    message: null,
    name: null,
  };
} catch (error) {
  return {
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : 'Error',
  };
}
`;

describe('lavamoat', function (this: Mocha.Suite) {
  it('the UI environment enforces the lavamoat policy', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate(PAGES.HOME);
        const result: ThrowLavamoatErrorScriptResult =
          await driver.executeScript(throwLavamoatErrorScript);
        assert.equal(result.name, 'TypeError');
        assert.match(
          result.message ?? '',
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
          const result: ThrowLavamoatErrorScriptResult =
            await driver.executeScriptInExtensionServiceWorker(
              throwLavamoatErrorScript,
            );
          assert.equal(result.name, 'TypeError');
          assert.match(
            result.message ?? '',
            /Cannot read properties of undefined \(reading 'log'\)/u,
          );
        } else {
          await driver.navigate(PAGES.BACKGROUND);
          const result: ThrowLavamoatErrorScriptResult =
            await driver.executeScript(throwLavamoatErrorScript);
          assert.equal(result.name, 'TypeError');
          assert.match(
            result.message ?? '',
            /Cannot read properties of undefined \(reading 'log'\)/u,
          );
        }
      },
    );
  });
});
