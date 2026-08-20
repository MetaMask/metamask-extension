import { withFixtures } from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import Homepage from '../../../page-objects/pages/home/homepage';
import NFTDetailsPage from '../../../page-objects/pages/nft-details-page';
import NftsTab from '../../../page-objects/pages/home/nfts-tab';
import { login } from '../../../page-objects/flows/login.flow';

describe('Remove NFT', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  it('user should be able to remove ERC721 NFT on details page', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2().withNftControllerERC721().build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        await login(driver, { localNode: localNodes[0] });

        // Open the NFT details page and click to remove NFT
        await new Homepage(driver).goToNftTab();
        const nftsTab = new NftsTab(driver);
        await nftsTab.clickNFTIconOnActivityList();

        const nftDetailsPage = new NFTDetailsPage(driver);
        await nftDetailsPage.checkPageIsLoaded();
        await nftDetailsPage.removeNFT();

        // Check the success remove NFT toaster is displayed and the NFT is removed from the NFT tab
        await nftsTab.checkSuccessRemoveNftMessageIsDisplayed();
        await nftsTab.checkNoNftInfoIsDisplayed();
      },
    );
  });
});
