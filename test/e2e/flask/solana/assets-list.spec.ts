import { Suite } from 'mocha';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { withSolanaAccountSnap } from './common-solana';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';


describe('Multichain Asset List', function (this: Suite) {

  const NETWORK_NAME_MAINNET = 'Ethereum Mainnet';
  it('displays all assets in the asset list', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: false,
        mockCalls: true,
      },
      async (driver) => {
        const assetListPage = new AssetListPage(driver);
        await assetListPage.check_tokenItemNumber(3);
      },
    );
  });

  it.only('displays assets for the current network when switching networks', async function () {
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
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(NETWORK_NAME_MAINNET);
        await assetListPage.check_tokenItemNumber(2);
      },
    );
  });
});
