import { Suite } from 'mocha';

import FixtureBuilder from '../fixture-builder';
import {
  defaultGanacheOptions,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} from '../helpers';
import { Driver } from '../webdriver/driver';

/**
 * Starts the flow to create a watch account.
 *
 * @param driver - The WebDriver instance used to control the browser.
 * @returns A promise that resolves when the setup steps are complete.
 */
async function startCreateWatchAccountFlow(driver: Driver): Promise<void> {
  await unlockWallet(driver);

  await driver.clickElement('[data-testid="account-menu-icon"]');
  await driver.clickElement(
    '[data-testid="multichain-account-menu-popover-action-button"]',
  );
  await driver.clickElement(
    '[data-testid="multichain-account-menu-popover-add-watch-only-account"]',
  );

  // Wait until dialog is opened before proceeding
  await driver.waitAndSwitchToWindowWithTitle(3, WINDOW_TITLES.Dialog);
}

describe('Account-watcher snap', function (this: Suite) {
  it("user can add watch account via snap by clicking 'Watch an Ethereum account'", async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // start the add watch account flow and switch to dialog window
        await startCreateWatchAccountFlow(driver);

        await driver.fill(
          '[placeholder="Enter a public address or ENS name"]',
          'vitalik.eth',
        );
        await driver.clickElement({ text: 'Watch account', tag: 'button' });
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'vitalik.eth',
        });
      },
    );
  });
});
