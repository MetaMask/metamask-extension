import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures, unlockWallet } from '../../helpers';
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';

describe('Lattice hardware wallet @no-mmi', function (this: Suite) {
  it('connects to lattice hardware wallet', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        // choose Connect hardware wallet from the account menu
        await driver.clickElement('[data-testid="account-menu-icon"]');

        // Wait until account list is loaded to mitigate race condition
        await driver.waitForSelector({
          text: 'Account 1',
          tag: 'span',
        });
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.clickElement({
          text: 'Add hardware wallet',
          tag: 'button',
        });
        await driver.findClickableElement(
          '[data-testid="hardware-connect-close-btn"]',
        );
        await driver.clickElement('[data-testid="connect-lattice-btn"]');
        await driver.clickElement({ text: 'Continue', tag: 'button' });

        const allWindows = await driver.waitUntilXWindowHandles(2);
        assert.equal(allWindows.length, isManifestV3 ? 3 : 2);
      },
    );
  });
});
