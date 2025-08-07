import { Suite } from 'mocha';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { ACCOUNT_TYPE } from '../../constants';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { withSolanaAccountSnap } from './common-solana';

describe('Switching between account from different networks', function (this: Suite) {
  it('Switch from Solana account to another Network account', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        console.log('Starting test');
        const assetList = new AssetListPage(driver);
        await headerNavbar.checkPageIsLoaded();
        await headerNavbar.checkAccountLabel('Solana 1');
        await assetList.checkNetworkFilterText('Solana');
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.selectAccount('Account 1');
        await assetList.checkNetworkFilterText('Localhost 8545');
      },
    );
  });
  it('Create a Solana account when Solana network is not selected', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        const assetList = new AssetListPage(driver);
        await headerNavbar.checkPageIsLoaded();
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.selectAccount('Account 1');
        await assetList.checkNetworkFilterText('Localhost 8545');
        await headerNavbar.openAccountMenu();
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Solana,
          accountName: 'Solana Account 2',
        });
        await assetList.checkNetworkFilterText('Solana');
        await headerNavbar.checkAccountLabel('Solana Account 2');
      },
    );
  });
});
