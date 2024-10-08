import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import messages from '../../../app/_locales/en/messages.json';
import FixtureBuilder from '../fixture-builder';
import { defaultGanacheOptions, unlockWallet, withFixtures } from '../helpers';
import { Driver } from '../webdriver/driver';

const ACCOUNT_1 = '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1';
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
  if (unlockWalletFirst) {
    await unlockWallet(driver);
  }

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
 * @param unlockWalletFirst - Whether to unlock the wallet before watching the address.
 * @param address - The EOA address to watch.
 */
async function watchEoaAddress(
  driver: Driver,
  unlockWalletFirst: boolean = true,
  address: string = EOA_ADDRESS,
): Promise<void> {
  await startCreateWatchAccountFlow(driver, unlockWalletFirst);
  await driver.fill('input#address-input[type="text"]', address);
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
  describe('Adding watched accounts', function () {
    it('adds watch account with valid EOA address', async function () {
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
          // watch an EOA address
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

    it("disables 'Send' 'Swap' and 'Bridge' buttons for watch accounts", async function () {
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
          // watch an EOA address
          await watchEoaAddress(driver);

          // 'Send' button should be disabled
          await driver.findElement(
            '[data-testid="eth-overview-send"][disabled]',
          );
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

          // check tooltips for disabled buttons
          await driver.findElement(
            '.icon-button--disabled [data-tooltipped][data-original-title="Not supported with this account."]',
          );
        },
      );
    });
  });

  describe('Invalid input handling', function () {
    const invalidInputTests = [
      {
        input: 'd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        message: 'Invalid input',
        description: 'address missing 0x prefix',
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
        message: `Unknown snap error: Account address '${ACCOUNT_1}' already exists`,
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

            await driver.fill('input#address-input[type="text"]', input);
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
  });

  describe('Account management', function () {
    it('does not allow user to import private key of watched address', async function () {
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
          // watch an EOA address for ACCOUNT_2
          await watchEoaAddress(driver, true, ACCOUNT_2);

          // try to import private key of watched ACCOUNT_2 address
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

    it("does not display 'Show private key' button for watch accounts", async function () {
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
          // watch an EOA address
          await watchEoaAddress(driver);

          // click to view account details
          await driver.clickElement(
            '[data-testid="account-options-menu-button"]',
          );
          await driver.clickElement(
            '[data-testid="account-list-menu-details"]',
          );
          // 'Show private key' button should not be displayed
          await driver.assertElementNotPresent({
            css: 'button',
            text: 'Show private key',
          });
        },
      );
    });

    it('removes a watched account', async function () {
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
          // watch an EOA address
          await watchEoaAddress(driver);

          // remove the selected watched account
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

    it('can remove and recreate a watched account', async function () {
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
          // watch an EOA address
          await watchEoaAddress(driver);

          // remove the selected watched account
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

          // watch the same EOA address again
          await watchEoaAddress(driver, false);

          // same account should be displayed in the account list
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

  describe('Experimental toggle', function () {
    const navigateToExperimentalSettings = async (driver: Driver) => {
      await driver.clickElement('[data-testid="account-options-menu-button"]');
      await driver.clickElement({ text: 'Settings', tag: 'div' });
      await driver.clickElement({ text: 'Experimental', tag: 'div' });
      await driver.waitForSelector({
        text: messages.watchEthereumAccountsToggle.message,
        tag: 'span',
      });
    };

    const getToggleState = async (driver: Driver): Promise<boolean> => {
      const toggleInput = await driver.findElement(
        '[data-testid="watch-account-toggle"]',
      );
      return toggleInput.isSelected();
    };

    const toggleWatchAccountOptionAndCloseSettings = async (driver: Driver) => {
      await driver.clickElement('[data-testid="watch-account-toggle-div"]');
      await driver.clickElement('button[aria-label="Close"]');
    };

    const verifyWatchAccountOptionAndCloseMenu = async (
      driver: Driver,
      shouldBePresent: boolean,
    ) => {
      await driver.clickElement('[data-testid="account-menu-icon"]');
      await driver.clickElement(
        '[data-testid="multichain-account-menu-popover-action-button"]',
      );
      if (shouldBePresent) {
        await driver.waitForSelector({
          text: messages.addEthereumWatchOnlyAccount.message,
          tag: 'button',
        });
      } else {
        await driver.assertElementNotPresent({
          text: messages.addEthereumWatchOnlyAccount.message,
          tag: 'button',
        });
      }
      await driver.clickElement('button[aria-label="Close"]');
    };

    it("will show the 'Watch an Ethereum account (Beta)' option when setting is enabled", async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);
          await navigateToExperimentalSettings(driver);

          // verify toggle is off by default
          assert.equal(
            await getToggleState(driver),
            false,
            'Toggle should be off by default',
          );

          // enable the toggle
          await toggleWatchAccountOptionAndCloseSettings(driver);

          // verify the 'Watch and Ethereum account (Beta)' option is available
          await verifyWatchAccountOptionAndCloseMenu(driver, true);
        },
      );
    });

    it('enables and then disables the toggle and the option to add a watch-only account behaves as expected', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);
          await navigateToExperimentalSettings(driver);

          // enable the toggle
          await toggleWatchAccountOptionAndCloseSettings(driver);

          // verify the 'Watch and Ethereum account (Beta)' option is available
          await verifyWatchAccountOptionAndCloseMenu(driver, true);

          // navigate back to experimental settings
          await navigateToExperimentalSettings(driver);

          // disable the toggle
          await toggleWatchAccountOptionAndCloseSettings(driver);

          // verify the 'Watch and Ethereum account (Beta)' option is not available
          await verifyWatchAccountOptionAndCloseMenu(driver, false);
        },
      );
    });
  });
});
