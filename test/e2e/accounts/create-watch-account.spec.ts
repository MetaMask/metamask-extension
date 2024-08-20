import { Suite } from 'mocha';

import FixtureBuilder from '../fixture-builder';
import { defaultGanacheOptions, unlockWallet, withFixtures } from '../helpers';
import { Driver } from '../webdriver/driver';

const ACCOUNT_1 = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
const EOA_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const SHORTENED_EOA_ADDRESS = '0xd8dA6...96045';
const DEFAULT_WATCHED_ACCOUNT_NAME = 'Watched Account 1';

/**
 * Start the flow to create a watch account by clicking the account menu and selecting the option to add a watch account.
 *
 * @param driver - The WebDriver instance used to control the browser.
 * @param unlockWalletFirst - Whether to unlock the wallet before starting the flow.
 */
async function startCreateWatchAccountFlow(
  driver: Driver,
  unlockWalletFirst: boolean = true,
): Promise<void> {
  if (unlockWalletFirst) await unlockWallet(driver);

  await driver.clickElement('[data-testid="account-menu-icon"]');
  await driver.clickElement(
    '[data-testid="multichain-account-menu-popover-action-button"]',
  );
  await driver.clickElement(
    '[data-testid="multichain-account-menu-popover-add-watch-only-account"]',
  );
}

/**
 * Watches an EOA address.
 *
 * @param driver - The WebDriver instance used to control the browser.
 * @param unlockWallet - Whether to unlock the wallet before watching the address.
 * @param address - The EOA address to watch.
 */
async function watchEoaAddress(
  driver: Driver,
  unlockWallet: boolean = true,
  address: string = EOA_ADDRESS,
): Promise<void> {
  await startCreateWatchAccountFlow(driver, unlockWallet);
  await driver.fill(
    '[placeholder="Enter a public address or ENS name"]',
    address,
  );
  await driver.clickElement({ text: 'Watch account', tag: 'button' });
  await driver.clickElement('[data-testid="submit-add-account-with-name"]');
}

/**
 * Removes the selected account.
 *
 * @param driver - The WebDriver instance used to control the browser.
 */
async function removeSelectedAccount(driver: Driver): Promise<void> {
  await driver.clickElement('[data-testid="account-menu-icon"]');
  await driver.clickElement(
    '.multichain-account-list-item--selected [data-testid="account-list-item-menu-button"]',
  );
  await driver.clickElement('[data-testid="account-list-menu-remove"]');
  await driver.clickElement({ text: 'Remove', tag: 'button' });
}

describe('Account-watcher snap', function (this: Suite) {
  it('user can add watch account with valid EOA address', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerAndFeatureFlag({
            watchEthereumAccountEnabled: true,
          })
          .withNetworkControllerOnMainnet()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // watch EOA address
        await watchEoaAddress(driver);

        // new account should be displayed in the account list
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: DEFAULT_WATCHED_ACCOUNT_NAME,
        });
        await driver.findElement({
          css: '.mm-text--ellipsis',
          text: SHORTENED_EOA_ADDRESS,
        });
      },
    );
  });

  it("'Send' 'Swap' and 'Bridge' buttons are disabled for watch accounts", async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerAndFeatureFlag({
            watchEthereumAccountEnabled: true,
          })
          .withNetworkControllerOnMainnet()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // watch EOA address
        await watchEoaAddress(driver);

        // 'Send' button should be disabled
        await driver.findElement('[data-testid="eth-overview-send"][disabled]');
        await driver.findElement(
          '[data-testid="eth-overview-send"].icon-button--disabled',
        );

        // 'Swap' button should be disabled
        await driver.findElement(
          '[data-testid="token-overview-button-swap"][disabled]',
        );
        await driver.findElement(
          '[data-testid="token-overview-button-swap"].icon-button--disabled',
        );

        // 'Bridge' button should be disabled
        await driver.findElement(
          '[data-testid="eth-overview-bridge"][disabled]',
        );
        await driver.findElement(
          '[data-testid="eth-overview-bridge"].icon-button--disabled',
        );

        // Check tooltips for disabled buttons
        await driver.findElement(
          '.icon-button--disabled [data-tooltipped][data-original-title="Not supported with this account."]',
        );
      },
    );
  });

  const invalidInputTests = [
    {
      input: 'd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      message: 'Invalid input',
      description: 'missing 0x prefix',
    },
    {
      input: '0x123ABC',
      message: 'Invalid address',
      description: 'invalid address',
    },
    {
      input: 'invalid.eth',
      message: 'Invalid ENS name',
      description: 'invalid ENS name',
    },
    {
      input: ACCOUNT_1,
      message:
        "Unknown snap error: Account address '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1' already exists",
      description: 'existing address',
    },
  ];

  invalidInputTests.forEach(({ input, message, description }) => {
    it(`handles invalid input: ${description}`, async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withPreferencesControllerAndFeatureFlag({
              watchEthereumAccountEnabled: true,
            })
            .withNetworkControllerOnMainnet()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await startCreateWatchAccountFlow(driver);

          await driver.fill(
            '[placeholder="Enter a public address or ENS name"]',
            input,
          );
          await driver.clickElement({ text: 'Watch account', tag: 'button' });

          // error message should be displayed by the snap
          await driver.findElement({
            css: '.snap-ui-renderer__text',
            text: message,
          });
        },
      );
    });
  });

  it('user cannot input private key of watched address', async function () {
    const PRIVATE_KEY_TWO =
      '0xf444f52ea41e3a39586d7069cb8e8233e9f6b9dea9cbb700cce69ae860661cc8';
    const ACCOUNT_2 = '0x09781764c08de8ca82e156bbf156a3ca217c7950';

    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerAndFeatureFlag({
            watchEthereumAccountEnabled: true,
          })
          .withNetworkControllerOnMainnet()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // watch EOA address
        await watchEoaAddress(driver, true, ACCOUNT_2);

        // import private key of account 2
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.clickElement({ text: 'Import account', tag: 'button' });
        await driver.findClickableElement('#private-key-box');
        await driver.fill('#private-key-box', PRIVATE_KEY_TWO);
        await driver.clickElement(
          '[data-testid="import-account-confirm-button"]',
        );

        // error message should be displayed
        await driver.findElement({
          css: '.mm-box--color-error-default',
          text: 'KeyringController - The account you are trying to import is a duplicate',
        });
      },
    );
  });

  it('Show private key button is not displayed for watch accounts', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerAndFeatureFlag({
            watchEthereumAccountEnabled: true,
          })
          .withNetworkControllerOnMainnet()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // watch EOA address
        await watchEoaAddress(driver);

        // click to view account details
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement('[data-testid="account-list-menu-details"]');
        // show private key button should not be displayed
        await driver.assertElementNotPresent({
          css: 'button',
          text: 'Show private key',
        });
      },
    );
  });

  it('removes a watch account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerAndFeatureFlag({
            watchEthereumAccountEnabled: true,
          })
          .withNetworkControllerOnMainnet()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // watch EOA address
        await watchEoaAddress(driver);

        // remove the selected watch account
        await removeSelectedAccount(driver);

        // account should be removed from the account list
        await driver.assertElementNotPresent({
          css: '[data-testid="account-menu-icon"]',
          text: DEFAULT_WATCHED_ACCOUNT_NAME,
        });
        await driver.assertElementNotPresent({
          css: '.mm-text--ellipsis',
          text: SHORTENED_EOA_ADDRESS,
        });
      },
    );
  });

  it('removes and re-adds a watch account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerAndFeatureFlag({
            watchEthereumAccountEnabled: true,
          })
          .withNetworkControllerOnMainnet()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // watch EOA address
        await watchEoaAddress(driver);

        // remove the selected watch account
        await removeSelectedAccount(driver);

        // account should be removed from the account list
        await driver.assertElementNotPresent({
          css: '[data-testid="account-menu-icon"]',
          text: DEFAULT_WATCHED_ACCOUNT_NAME,
        });
        await driver.assertElementNotPresent({
          css: '.mm-text--ellipsis',
          text: SHORTENED_EOA_ADDRESS,
        });

        // re-add the watch account
        await watchEoaAddress(driver, false);

        // new account should be displayed in the account list
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: DEFAULT_WATCHED_ACCOUNT_NAME,
        });
        await driver.findElement({
          css: '.mm-text--ellipsis',
          text: SHORTENED_EOA_ADDRESS,
        });
      },
    );
  });
});
