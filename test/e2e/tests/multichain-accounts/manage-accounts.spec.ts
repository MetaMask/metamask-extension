import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { importAdditionalSecretRecoveryPhrase } from '../../page-objects/flows/multi-srp.flow';
import HeaderNavbar from '../../page-objects/pages/home/header-navbar';
import AccountListPage from '../../page-objects/pages/accounts/list-page';
import ManageAccountsPage from '../../page-objects/pages/accounts/manage-accounts-page';
import { Driver } from '../../webdriver/driver';
import {
  DEFAULT_FIXTURE_ACCOUNT_ID,
  HARDWARE_WALLET_ACCOUNT_ID,
} from '../../constants';

describe('Multichain Accounts - Manage accounts page', function (this: Suite) {
  it('navigates from account list and renders search, sections, and add wallet CTA', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withLedgerAccount()
          .withShowNativeTokenAsMainBalanceDisabled()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withAssetsController(
            {
              assetsBalance: {
                [DEFAULT_FIXTURE_ACCOUNT_ID]: {
                  'eip155:1337/slip44:1': {
                    amount: '0',
                  },
                },
                [HARDWARE_WALLET_ACCOUNT_ID]: {
                  'eip155:1337/slip44:1': {
                    amount: '0',
                  },
                },
              },
            },
            { overwrite: true },
          )
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          expectedBalance: '0',
          waitForNonEvmAccounts: false,
        });

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.openManageAccounts();

        const manageAccountsPage = new ManageAccountsPage(driver);
        await manageAccountsPage.checkPageIsLoaded();

        // Verify sections exist
        await manageAccountsPage.checkWalletSectionExists('hardware-wallets');

        // Test search filter and no results message
        await manageAccountsPage.search('NonexistentAccount');
        await manageAccountsPage.checkNoAccountsFound();

        // Clear search
        await manageAccountsPage.search('');
        await manageAccountsPage.checkAccountIsDisplayed('Account 1');

        // Click Add Wallet and verify navigation to choose wallet type page
        await manageAccountsPage.clickAddWalletButton();
        await driver.waitForSelector('[data-testid="choose-new-wallet-type-page"]');
      },
    );
  });

  it('allows direct hiding and unhiding of accounts in manage accounts', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          expectedBalance: '0',
          waitForNonEvmAccounts: false,
        });

        await driver.navigate('#/manage-accounts');

        const manageAccountsPage = new ManageAccountsPage(driver);
        await manageAccountsPage.checkPageIsLoaded();
        await manageAccountsPage.checkAccountIsDisplayed('Account 1');

        // Toggle visibility to hide
        await manageAccountsPage.toggleAccountVisibilityByAccountName('Account 1');

        // Toggle visibility to unhide
        await manageAccountsPage.toggleAccountVisibilityByAccountName('Account 1');

        // Verify account is still visible in manage accounts
        await manageAccountsPage.checkAccountIsDisplayed('Account 1');
      },
    );
  });

  it('allows removing a secondary entropy wallet with confirmation', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          expectedBalance: '0',
          waitForNonEvmAccounts: false,
        });

        // Import a secondary secret recovery phrase
        await importAdditionalSecretRecoveryPhrase(driver);

        // Navigate to Manage Accounts
        await driver.navigate('#/manage-accounts');

        const manageAccountsPage = new ManageAccountsPage(driver);
        await manageAccountsPage.checkPageIsLoaded();
        await manageAccountsPage.checkAccountIsDisplayed('Wallet 2');

        // Cancel wallet removal
        await manageAccountsPage.clickRemoveWallet('entropy:01JKAF3DSGM3AB87EM9N0K41AK');
        await manageAccountsPage.cancelWalletRemoval();
        await manageAccountsPage.checkAccountIsDisplayed('Wallet 2');

        // Confirm wallet removal
        await manageAccountsPage.clickRemoveWallet('entropy:01JKAF3DSGM3AB87EM9N0K41AK');
        await manageAccountsPage.confirmWalletRemoval();
        await manageAccountsPage.checkAccountIsNotDisplayed('Wallet 2');
      },
    );
  });
});
