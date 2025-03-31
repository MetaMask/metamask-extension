import { MockttpServer } from 'mockttp';
import { withFixtures } from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import FixtureBuilder from '../../../fixture-builder';
import Homepage from '../../../page-objects/pages/home/homepage';
import NFTDetailsPage from '../../../page-objects/pages/nft-details-page';
import NftListPage from '../../../page-objects/pages/home/nft-list';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';

async function mockIPFSRequest(mockServer: MockttpServer) {
  return [
    await mockServer
      .forGet(
        'https://bafkreifvhjdf6ve4jfv6qytqtux5nd4nwnelioeiqx5x2ez5yrgrzk7ypi.ipfs.dweb.link/',
      )
      .thenCallback(() => ({ statusCode: 200 })),
  ];
}

describe('Remove ERC1155 NFT', function () {
  const smartContract = SMART_CONTRACTS.ERC1155;

  it('user should be able to remove ERC1155 NFT on details page', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC1155().build(),
        smartContract,
        title: this.test?.fullTitle(),
        testSpecificMock: mockIPFSRequest,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Open the NFT details page and click to remove NFT
        await new Homepage(driver).goToNftTab();
        const nftListPage = new NftListPage(driver);
        await nftListPage.clickNFTIconOnActivityList();

        const nftDetailsPage = new NFTDetailsPage(driver);
        await nftDetailsPage.check_pageIsLoaded();
        await nftDetailsPage.removeNFT();

        // Check the success remove NFT toaster is displayed and the NFT is removed from the NFT tab
        await nftListPage.check_successRemoveNftMessageIsDisplayed();
        await nftListPage.check_noNftInfoIsDisplayed();
      },
    );
  });
});
