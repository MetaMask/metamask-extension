import { withFixtures } from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { MOCK_META_METRICS_ID } from '../../../constants';
import Homepage from '../../../page-objects/pages/home/homepage';
import NFTDetailsPage from '../../../page-objects/pages/nft-details-page';
import NftListPage from '../../../page-objects/pages/home/nft-list';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';

describe('Remove NFT', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  it('user should be able to remove ERC721 NFT on details page', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withNftControllerERC721()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);

        // Open the NFT details page and click to remove NFT
        await new Homepage(driver).goToNftTab();
        const nftListPage = new NftListPage(driver);
        await nftListPage.clickNFTIconOnActivityList();

        const nftDetailsPage = new NFTDetailsPage(driver);
        await nftDetailsPage.checkPageIsLoaded();
        await nftDetailsPage.removeNFT();

        // Check the success remove NFT toaster is displayed and the NFT is removed from the NFT tab
        await nftListPage.checkSuccessRemoveNftMessageIsDisplayed();
        await nftListPage.checkNoNftInfoIsDisplayed();
      },
    );
  });
});
