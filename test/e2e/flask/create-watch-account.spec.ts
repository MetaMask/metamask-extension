import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilder from '../fixture-builder';
import { withFixtures } from '../helpers';
import { Driver } from '../webdriver/driver';
import AccountDetailsModal from '../page-objects/pages/dialog/account-details-modal';
import AccountListPage from '../page-objects/pages/account-list-page';
import ExperimentalSettings from '../page-objects/pages/settings/experimental-settings';
import HeaderNavbar from '../page-objects/pages/header-navbar';
import HomePage from '../page-objects/pages/home/homepage';
import SettingsPage from '../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { watchEoaAddress } from '../page-objects/flows/watch-account.flow';

const ACCOUNT_1 = '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1';
const EOA_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const SHORTENED_EOA_ADDRESS = '0xd8dA6...96045';
const DEFAULT_WATCHED_ACCOUNT_NAME = 'Watched Account 1';

describe('Account-watcher snap', function (this: Suite) {
  describe('Adding watched accounts', function () {
    it('adds watch account with valid EOA address', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withPreferencesController({
              watchEthereumAccountEnabled: true,
            })
            .withNetworkControllerOnMainnet()
            .withEnabledNetworks({
              eip155: {
                '0x1': true,
              },
            })
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          // watch an EOA address
          await loginWithBalanceValidation(driver);
          await watchEoaAddress(driver, EOA_ADDRESS);

          // new account should be displayed in the account list
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.checkAccountLabel(DEFAULT_WATCHED_ACCOUNT_NAME);
          await headerNavbar.checkAccountAddress(SHORTENED_EOA_ADDRESS);
        },
      );
    });

    it("disables 'Send' and 'Bridge' buttons for watch accounts", async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withPreferencesController({
              watchEthereumAccountEnabled: true,
            })
            .withNetworkControllerOnMainnet()
            .withEnabledNetworks({
              eip155: {
                '0x1': true,
              },
            })
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          // watch an EOA address
          await loginWithBalanceValidation(driver);
          await watchEoaAddress(driver, EOA_ADDRESS);
          const homePage = new HomePage(driver);
          await homePage.headerNavbar.checkAccountLabel(
            DEFAULT_WATCHED_ACCOUNT_NAME,
          );

          // 'Send' button should be disabled
          assert.equal(await homePage.checkIfSendButtonIsClickable(), false);

          // 'Bridge' button should be disabled
          assert.equal(await homePage.checkIfBridgeButtonIsClickable(), false);
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
              .withPreferencesController({
                watchEthereumAccountEnabled: true,
              })
              .withNetworkControllerOnMainnet()
              .withEnabledNetworks({
                eip155: {
                  '0x1': true,
                },
              })
              .build(),
            title: this.test?.fullTitle(),
          },
          async ({ driver }: { driver: Driver }) => {
            await loginWithBalanceValidation(driver);
            const homePage = new HomePage(driver);
            await homePage.checkPageIsLoaded();
            await homePage.checkExpectedBalanceIsDisplayed();

            // error message should be displayed by snap when try to watch an EOA with invalid input
            await homePage.headerNavbar.openAccountMenu();
            const accountListPage = new AccountListPage(driver);
            await accountListPage.checkPageIsLoaded();
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
            .withPreferencesController({
              watchEthereumAccountEnabled: true,
            })
            .withNetworkControllerOnMainnet()
            .withEnabledNetworks({
              eip155: {
                '0x1': true,
              },
            })
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          // watch an EOA address for ACCOUNT_2
          await loginWithBalanceValidation(driver);
          await watchEoaAddress(driver, ACCOUNT_2);
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.checkAccountLabel(DEFAULT_WATCHED_ACCOUNT_NAME);

          // try to import private key of watched ACCOUNT_2 address and check error message
          await headerNavbar.openAccountMenu();
          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded();
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
            .withPreferencesController({
              watchEthereumAccountEnabled: true,
            })
            .withNetworkControllerOnMainnet()
            .withEnabledNetworks({
              eip155: {
                '0x1': true,
              },
            })
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          // watch an EOA address
          await loginWithBalanceValidation(driver);
          await watchEoaAddress(driver, EOA_ADDRESS);

          // open account details modal in header navbar
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.checkAccountLabel(DEFAULT_WATCHED_ACCOUNT_NAME);
          await headerNavbar.openAccountDetailsModalDetailsTab();

          // check 'Show private key' button should not be displayed
          const accountDetailsModal = new AccountDetailsModal(driver);
          await accountDetailsModal.checkPageIsLoaded();
          await accountDetailsModal.checkShowPrivateKeyButtonIsNotDisplayed();
        },
      );
    });

    it('removes a watched account and recreate a watched account', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withPreferencesController({
              watchEthereumAccountEnabled: true,
            })
            .withNetworkControllerOnMainnet()
            .withEnabledNetworks({
              eip155: {
                '0x1': true,
              },
            })
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          // watch an EOA address
          await loginWithBalanceValidation(driver);
          await watchEoaAddress(driver, EOA_ADDRESS);
          const homePage = new HomePage(driver);
          await homePage.headerNavbar.checkAccountLabel(
            DEFAULT_WATCHED_ACCOUNT_NAME,
          );

          // remove the selected watched account
          await homePage.headerNavbar.openAccountMenu();
          const accountListPage = new AccountListPage(driver);
          await accountListPage.removeAccount(DEFAULT_WATCHED_ACCOUNT_NAME);
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedBalanceIsDisplayed();

          // account should be removed from the account list
          await homePage.headerNavbar.openAccountMenu();
          await accountListPage.checkAccountIsNotDisplayedInAccountList(
            DEFAULT_WATCHED_ACCOUNT_NAME,
          );
          await accountListPage.closeAccountModal();
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedBalanceIsDisplayed();

          // watch the same EOA address again and check the account is recreated
          await watchEoaAddress(driver, EOA_ADDRESS);
          await homePage.headerNavbar.checkAccountLabel(
            DEFAULT_WATCHED_ACCOUNT_NAME,
          );
          await homePage.headerNavbar.checkAccountAddress(
            SHORTENED_EOA_ADDRESS,
          );
        },
      );
    });
  });

  describe('Experimental toggle', function () {
    it("will show the 'Watch an Ethereum account (Beta)' option when setting is enabled", async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedBalanceIsDisplayed();

          // navigate to experimental settings
          await homePage.headerNavbar.openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToExperimentalSettings();
          const experimentalSettings = new ExperimentalSettings(driver);
          await experimentalSettings.checkPageIsLoaded();

          // verify watch account toggle is off by default and enable the toggle
          assert.equal(
            await experimentalSettings.getWatchAccountToggleState(),
            false,
            'Toggle should be off by default',
          );
          await experimentalSettings.toggleWatchAccount();
          await settingsPage.closeSettingsPage();

          // verify the 'Watch and Ethereum account (Beta)' option is available
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedBalanceIsDisplayed();
          await homePage.headerNavbar.openAccountMenu();
          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded();
          await accountListPage.checkAddWatchAccountAvailable(true);
        },
      );
    });

    it('enables and then disables the toggle and the option to add a watch-only account behaves as expected', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedBalanceIsDisplayed();

          // navigate to experimental settings and enable the toggle
          await homePage.headerNavbar.openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToExperimentalSettings();
          const experimentalSettings = new ExperimentalSettings(driver);
          await experimentalSettings.checkPageIsLoaded();
          await experimentalSettings.toggleWatchAccount();
          await settingsPage.closeSettingsPage();

          // verify the 'Watch and Ethereum account (Beta)' option is available
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedBalanceIsDisplayed();
          await homePage.headerNavbar.openAccountMenu();
          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded();
          await accountListPage.checkAddWatchAccountAvailable(true);
          await accountListPage.closeAccountModal();

          // navigate back to experimental settings and disable the toggle
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedBalanceIsDisplayed();
          await homePage.headerNavbar.openSettingsPage();
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToExperimentalSettings();
          await experimentalSettings.checkPageIsLoaded();
          await experimentalSettings.toggleWatchAccount();
          await settingsPage.closeSettingsPage();

          // verify the 'Watch and Ethereum account (Beta)' option is not available
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedBalanceIsDisplayed();
          await homePage.headerNavbar.openAccountMenu();
          await accountListPage.checkPageIsLoaded();
          await accountListPage.checkAddWatchAccountAvailable(false);
        },
      );
    });
  });
});
