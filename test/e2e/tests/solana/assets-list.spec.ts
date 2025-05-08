import { Suite } from 'mocha';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { ACCOUNT_TYPE } from '../../constants';
import { withSolanaAccountSnap } from './common-solana';

describe('Multichain Asset List', function (this: Suite) {
  const NETWORK_NAME_MAINNET = 'Ethereum Mainnet';
  const LINEA_NAME_MAINNET = 'Linea Mainnet';
  const SOLANA_NAME_MAINNET = 'Solana';

  it('displays all assets in the asset list for the selected network', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: false,
        mockCalls: true,
      },
      async (driver) => {
        const assetListPage = new AssetListPage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        await assetListPage.check_tokenItemNumber(3);
        await assetListPage.check_tokenExistsInList('Solana', '50');
        await assetListPage.check_tokenExistsInList('PUMPKIN', '6');
        await assetListPage.check_tokenExistsInList('seek16z', '5');

        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(NETWORK_NAME_MAINNET);
        await assetListPage.check_tokenItemNumber(2);

        await assetListPage.check_tokenExistsInList('Ethereum');
        await assetListPage.check_tokenExistsInList('TST', '10');

        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(LINEA_NAME_MAINNET);
        await assetListPage.check_tokenItemNumber(1);
        await assetListPage.check_tokenExistsInList('Ethereum');

        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(SOLANA_NAME_MAINNET);
        await assetListPage.check_tokenItemNumber(3);
        await assetListPage.check_tokenExistsInList('Solana', '50');
        await assetListPage.check_tokenExistsInList('PUMPKIN', '6');
        await assetListPage.check_tokenExistsInList('seek16z', '5');
      },
    );
  });

  it('Newly created Solana account shows only one token in the assets list', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockZeroBalance: true,
      },
      async (driver) => {
        const assetListPage = new AssetListPage(driver);
        await assetListPage.check_tokenItemNumber(1);
        await assetListPage.check_tokenExistsInList('Solana', '0');
      },
    );
  });

  it('Newly created Ethereum account shows only one token in the assets list', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockZeroBalance: true,
      },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        const assetListPage = new AssetListPage(driver);

        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(NETWORK_NAME_MAINNET);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
          accountName: 'Ethereum 1',
        });

        await assetListPage.check_tokenItemNumber(1, 25000);
        await assetListPage.check_tokenExistsInList('Ethereum', '25');
      },
    );
  });
});
