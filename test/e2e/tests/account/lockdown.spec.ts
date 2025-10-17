import { strict as assert } from 'assert';
import { withFixtures } from '../../helpers';
import { PAGES, Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';

// Detect scuttling by prodding globals until found
// This for loop is likely running only once, unless the first global it finds is in the exceptions list. The test is immune to changes to scuttling exceptions.
function assertScuttling() {
  try {
    // eslint-disable-next-line guard-for-in
    for (const i in globalThis) {
      // @ts-expect-error we only want to trigger a getter if any
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      globalThis[i];
    }
  } catch (e) {
    if (
      (e as Error).message.includes(
        'of globalThis is inaccessible under scuttling mode',
      )
    ) {
      return;
    }
  }
  throw Error('Scuttling is not in effect');
}

// This is enough of a proof that lockdown is in effect and the shared prototypes are also hardened.
function assertLockdown() {
  if (
    !(
      Object.isFrozen(window.Object) &&
      Object.isFrozen(window.Object.prototype) &&
      Object.isFrozen(window.Function) &&
      Object.isFrozen(window.Function.prototype) &&
      Function.prototype.constructor !== window.Function // this is proof that repairIntrinsics part of lockdown worked
    )
  ) {
    throw Error('Lockdown is not in effect');
  }
}

const testCode = `
${assertLockdown.toString()};
assertLockdown();
${assertScuttling.toString()};
assertScuttling();
return true;
`;

describe('lockdown', function (this: Mocha.Suite) {
  it('the UI environment is locked down', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate(PAGES.HOME);
        assert(
          await driver.executeScript(testCode),
          'Expected script execution to be complete. driver.executeScript might have failed silently.',
        );
      },
    );
  });

  it('the background environment is locked down', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ignoredConsoleErrors: [
          'Error: Could not establish connection.',
          'Error: Premature close', // issue #35241
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        if (isManifestV3) {
          // TODO: add logic for testing the Service-Worker on MV3
          await driver.navigate(PAGES.OFFSCREEN);
        } else {
          await driver.navigate(PAGES.BACKGROUND);
        }
        assert(
          await driver.executeScript(testCode),
          'Expected script execution to be complete. driver.executeScript might have failed silently.',
        );
      },
    );
  });
});
