import { Suite } from 'mocha';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { withSolanaAccountSnap } from './common-solana';

describe('Solana/Evm accounts', function (this: Suite) {
  it('Network picker is disabled when Solana account is selected', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Solana 1');
        await headerNavbar.check_currentSelectedNetwork('Solana');
        await headerNavbar.check_ifNetworkPickerClickable(false);
        await headerNavbar.openAccountMenu();
        const accountMenu = new AccountListPage(driver);
        await accountMenu.switchToAccount('Account 1');
        await headerNavbar.check_currentSelectedNetwork('Localhost 8545');
        await headerNavbar.check_ifNetworkPickerClickable(true);
      },
    );
  });
});
