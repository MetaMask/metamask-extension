import { Suite } from 'mocha';

import FixtureBuilder from '../fixture-builder';
import {
  defaultGanacheOptions,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} from '../helpers';
import { Driver } from '../webdriver/driver';

const eoaAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const ensName = 'vitalik.eth';

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
  it('user can add watch account with valid EOA address', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerAndFeatureFlag({
            watchEthereumAccountEnabled: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // start the add watch account flow and switch to dialog window
        await startCreateWatchAccountFlow(driver);

        // fill in the ENS and click the watch account button
        await driver.fill(
          '[placeholder="Enter a public address or ENS name"]',
          eoaAddress,
        );
        await driver.clickElement({ text: 'Watch account', tag: 'button' });
        // success screen should show account created
        await driver.findElement({
          tag: 'h3',
          text: 'Account created',
        });
        await driver.findElement({
          css: '.multichain-account-list-item__account-name__button',
          text: 'vitalik.eth',
        });
        // click the okay button
        await driver.clickElement('[data-testid="confirmation-submit-button"]');
        // switch back to the main window
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'vitalik.eth',
        });
      },
    );
  });

  it('user can add watch account with valid ENS name', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerAndFeatureFlag({
            watchEthereumAccountEnabled: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // start the add watch account flow and switch to dialog window
        await startCreateWatchAccountFlow(driver);

        // fill in the ENS and click the watch account button
        await driver.fill(
          '[placeholder="Enter a public address or ENS name"]',
          ensName,
        );
        await driver.clickElement({ text: 'Watch account', tag: 'button' });
        // success screen should show account created
        await driver.findElement({
          tag: 'h3',
          text: 'Account created',
        });
        await driver.findElement({
          css: '.multichain-account-list-item__account-name__button',
          text: ensName,
        });
        // click the okay button
        await driver.clickElement('[data-testid="confirmation-submit-button"]');
        // switch back to the main window
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: ensName,
        });
      },
    );
  });
});
