import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import AccountListPage from '../../page-objects/pages/account-list-page';
import WalletDetailsPage from '../../page-objects/pages/wallet-details-page';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { withSolanaAccountSnap } from '../solana/common-solana';
import { mockMultichainAccountsFeatureFlagStateTwo } from './common';

// eslint-disable-next-line
describe.skip('Multichain Accounts - Wallet Details', function (this: Suite) {
  it('should view wallet details with one Ethereum and one Solana account and show SRP backup reminder', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        state: 2,
        numberOfAccounts: 1,
        withFixtureBuilder: (builder) =>
          builder.withKeyringControllerMultiSRP().withPreferencesController({
            dismissSeedBackUpReminder: false,
          }),
        withCustomMocks: async (mockServer: Mockttp) => {
          return mockMultichainAccountsFeatureFlagStateTwo(mockServer);
        },
      },
      async (driver: Driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        await accountListPage.checkWalletDetailsButtonIsDisplayed();
        await accountListPage.clickWalletDetailsButton();

        const walletDetailsPage = new WalletDetailsPage(driver);
        await walletDetailsPage.checkPageIsLoaded();

        await walletDetailsPage.checkWalletNameIsDisplayed('Wallet 1');
        await walletDetailsPage.checkBalanceIsDisplayed('$5,643.50');
        await walletDetailsPage.checkAccountIsDisplayed('Account 1');
        await walletDetailsPage.checkAccountIsDisplayed('Solana 1');
      },
    );
  });

  it('should add new Ethereum account from wallet details', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        numberOfAccounts: 1,
        withFixtureBuilder: (builder) =>
          builder.withKeyringControllerMultiSRP(),
        withCustomMocks: async (mockServer: Mockttp) => {
          return mockMultichainAccountsFeatureFlagStateTwo(mockServer);
        },
      },
      async (driver: Driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        await accountListPage.checkWalletDetailsButtonIsDisplayed();
        await accountListPage.clickWalletDetailsButton();

        const walletDetailsPage = new WalletDetailsPage(driver);
        await walletDetailsPage.checkPageIsLoaded();

        await walletDetailsPage.checkAddAccountButtonIsDisplayed();
        await walletDetailsPage.clickAddAccountButton();

        await walletDetailsPage.checkAccountTypeModalIsDisplayed();
        await walletDetailsPage.checkEthereumAccountOptionIsDisplayed();
        await walletDetailsPage.checkSolanaAccountOptionIsDisplayed();

        await walletDetailsPage.clickEthereumAccountOption();

        await walletDetailsPage.checkNumberOfAccountsDisplayed(3);
      },
    );
  });
});
