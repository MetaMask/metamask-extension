import { Suite } from 'mocha';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { ACCOUNT_TYPE } from '../../constants';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import { withSolanaAccountSnap } from './common-solana';

describe('Switching between account from different networks', function (this: Suite) {
  it('Switch from Solana account to another Network account', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Solana 1');
        await headerNavbar.check_ifNetworkPickerClickable(true);
        await headerNavbar.check_currentSelectedNetwork('Solana');
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.selectAccount('Account 1');
        await headerNavbar.check_ifNetworkPickerClickable(true);
        await headerNavbar.check_currentSelectedNetwork('Localhost 8545');
      },
    );
  });
  it('Create a Solana account when Solana network is not selected', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.selectAccount('Account 1');
        await headerNavbar.check_ifNetworkPickerClickable(true);
        await headerNavbar.check_currentSelectedNetwork('Localhost 8545');
        await headerNavbar.openAccountMenu();
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Solana,
          accountName: 'Solana Account 2',
        });
        await headerNavbar.check_ifNetworkPickerClickable(true);
        await headerNavbar.check_currentSelectedNetwork('Solana');
        await headerNavbar.check_accountLabel('Solana Account 2');
      },
    );
  });
  it('Create a Solana account and switch to another network', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.clickSwitchNetworkDropDown();
        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.check_pageIsLoaded();
        await selectNetworkDialog.selectNetworkName('Solana');
        await headerNavbar.check_currentSelectedNetwork('Solana');
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
        });
        await headerNavbar.check_accountLabel('Account 2');
      },
    );
  });
});
