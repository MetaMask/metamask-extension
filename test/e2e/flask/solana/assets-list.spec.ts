import { Suite } from 'mocha';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { withSolanaAccountSnap } from './common-solana';


describe('Multichain Asset List', function (this: Suite) {

  it.only('displays all assets in the asset list', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: false,
        mockCalls: true,
      },
      async (driver) => {
        const assetListPage = new AssetListPage(driver);
        await driver.delay(900000);
        await assetListPage.check_tokenItemNumber(3);

      },
    );
  });
});
