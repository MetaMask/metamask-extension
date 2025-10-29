import { Suite } from 'mocha';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { withSolanaAccountSnap } from '../solana/common-solana';

// eslint-disable-next-line
describe('Multichain Accounts - Wallet Details', function (this: Suite) {
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
      },
      async (driver: Driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded({
          isMultichainAccountsState2Enabled: true,
        });

        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 1');
        await accountListPage.checkAccountNameIsDisplayed('Account 1');
        // await accountListPage.checkAccountNameIsDisplayed('Solana 1')
        // BUG 37363
        // await walletDetailsPage.checkBalanceIsDisplayed('$5,643.50');
      },
    );
  });
});
