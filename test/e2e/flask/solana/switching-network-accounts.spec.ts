import { Suite } from 'mocha';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { withSolanaAccountSnap } from './common-solana';

describe('Switching between account from different networks', function (this: Suite) {
  it('Switch from Solana account to another Network account', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Solana 1');
        await headerNavbar.check_ifNetworkPickerClickable(false);
        await headerNavbar.check_currentSelectedNetwork('Solana');
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.selectAccount('Account 1');
        await headerNavbar.check_ifNetworkPickerClickable(true);
        await headerNavbar.check_currentSelectedNetwork('Localhost 8545');
      },
    );
  });
});
