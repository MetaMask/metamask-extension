import { strict as assert } from 'assert';
import { withFixtures } from '../../helpers';
import { PAGES, Driver } from '../../webdriver/driver';
import { executeScriptInExtensionServiceWorker } from '../../webdriver/extension-service-worker';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { isManifestV3 } from '../../../../shared/lib/mv3.utils';

const policyProbeScript = `
const storageKey = 'hasLavaMoatPolicyProbeConsoleAccess';
const deadline = Date.now() + 10_000;

while (Date.now() < deadline) {
  const result = await chrome.storage.session.get(storageKey);
  if (typeof result[storageKey] === 'boolean') {
    return result[storageKey];
  }
  await new Promise((resolve) => setTimeout(resolve, 50));
}

throw new Error('The LavaMoat policy probe result is unavailable');
`;

const domPolicyProbeScript = `
return document.documentElement.dataset.lavaMoatPolicyProbeConsoleAccess;
`;

describe('LavaMoat policy', function (this: Mocha.Suite) {
  it('denies unapproved globals in the UI dependency graph', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate(PAGES.HOME);

        assert.strictEqual(
          await driver.executeScript(domPolicyProbeScript),
          'false',
          'Expected LavaMoat to deny console access to the UI policy probe package',
        );
      },
    );
  });

  it('denies unapproved globals in the background dependency graph', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        if (isManifestV3) {
          await driver.navigate(PAGES.OFFSCREEN);
          assert.strictEqual(
            await driver.executeScript(domPolicyProbeScript),
            'false',
            'Expected LavaMoat to deny console access to the offscreen policy probe package',
          );

          await driver.navigate(PAGES.HOME);
          assert.strictEqual(
            await executeScriptInExtensionServiceWorker(
              driver,
              policyProbeScript,
            ),
            false,
            'Expected LavaMoat to deny console access to the service worker policy probe package',
          );
        } else {
          await driver.navigate(PAGES.BACKGROUND);
          assert.strictEqual(
            await driver.executeScript(domPolicyProbeScript),
            'false',
            'Expected LavaMoat to deny console access to the background policy probe package',
          );
        }
      },
    );
  });
});
