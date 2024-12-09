import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import messages from '../../../app/_locales/en/messages.json';
import FixtureBuilder from '../fixture-builder';
import { defaultGanacheOptions, unlockWallet, withFixtures } from '../helpers';
import { Driver } from '../webdriver/driver';

import AccountDetailsModal from '../page-objects/pages/dialog/account-details-modal';
import AccountListPage from '../page-objects/pages/account-list-page';
import HomePage from '../page-objects/pages/home/homepage';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';

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
    await loginWithBalanceValidation(driver);
  }

  const homePage = new HomePage(driver);
  await homePage.check_pageIsLoaded();

  await homePage.headerNavbar.openAccountMenu();
  const accountListPage = new AccountListPage(driver);
  await accountListPage.check_pageIsLoaded();


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
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);
          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.check_expectedBalanceIsDisplayed();

          // watch an EOA address
          await homePage.headerNavbar.openAccountMenu();
          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.addEoaAccount(EOA_ADDRESS);

          // new account should be displayed in the account list
          await homePage.check_pageIsLoaded();
          await homePage.headerNavbar.check_accountLabel(DEFAULT_WATCHED_ACCOUNT_NAME);
          await homePage.headerNavbar.check_accountAddress(SHORTENED_EOA_ADDRESS);
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
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);
          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.check_expectedBalanceIsDisplayed();

          // watch an EOA address
          await homePage.headerNavbar.openAccountMenu();
          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.addEoaAccount(EOA_ADDRESS);
          await homePage.check_pageIsLoaded();
          await homePage.headerNavbar.check_accountLabel(DEFAULT_WATCHED_ACCOUNT_NAME);

          // 'Send' button should be disabled
          assert.equal(await homePage.check_ifSendButtonIsClickable(), false);

          // 'Swap' button should be disabled
          assert.equal(await homePage.check_ifSwapButtonIsClickable(), false);

          // 'Bridge' button should be disabled
          assert.equal(await homePage.check_ifBridgeButtonIsClickable(), false);

          // check tooltips for disabled buttons
          await homePage.check_disabledButtonTooltip("Not supported with this account.");
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
        // FIXME: Watchout, the Snap bridge will lower-case EVM addresses, even in some error messages, this is
        // a mistake, and we might wanna re-change that later, see:
        // - https://github.com/MetaMask/accounts/pull/90/files#r1848713364
        message: `Unknown snap error: Account address '${ACCOUNT_1.toLowerCase()}' already exists`,
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
            title: this.test?.fullTitle(),
          },
          async ({ driver }: { driver: Driver }) => {
            await loginWithBalanceValidation(driver);
            const homePage = new HomePage(driver);
            await homePage.check_pageIsLoaded();
            await homePage.check_expectedBalanceIsDisplayed();

            // error message should be displayed by snap when try to watch an EOA with invalid input
            await homePage.headerNavbar.openAccountMenu();
            const accountListPage = new AccountListPage(driver);
            await accountListPage.check_pageIsLoaded();
            await accountListPage.addEoaAccount(input, message);
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
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);
          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.check_expectedBalanceIsDisplayed();

          // watch an EOA address for ACCOUNT_2
          await homePage.headerNavbar.openAccountMenu();
          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.addEoaAccount(ACCOUNT_2);
          await homePage.check_pageIsLoaded();
          await homePage.headerNavbar.check_accountLabel(DEFAULT_WATCHED_ACCOUNT_NAME);

          // try to import private key of watched ACCOUNT_2 address and check error message
          await homePage.headerNavbar.openAccountMenu();
          await accountListPage.check_pageIsLoaded();
          await accountListPage.addNewImportedAccount(
            PRIVATE_KEY_TWO,
            'KeyringController - The account you are trying to import is a duplicate',
          );
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
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);
          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.check_expectedBalanceIsDisplayed();

          // watch an EOA address for ACCOUNT_2
          await homePage.headerNavbar.openAccountMenu();
          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.addEoaAccount(EOA_ADDRESS);
          await homePage.check_pageIsLoaded();

          // open account details modal in header navbar
          await homePage.headerNavbar.check_accountLabel(DEFAULT_WATCHED_ACCOUNT_NAME);
          await homePage.headerNavbar.openAccountDetailsModal();

          // check 'Show private key' button should not be displayed
          const accountDetailsModal = new AccountDetailsModal(driver);
          await accountDetailsModal.check_pageIsLoaded();
          await accountDetailsModal.check_showPrivateKeyButtonIsNotDisplayed();
        },
      );
    });

    it.only('removes a watched account', async function () {
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
          throw new Error('Not implemented');
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
