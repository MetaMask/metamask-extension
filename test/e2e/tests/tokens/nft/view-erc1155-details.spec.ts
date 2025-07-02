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

describe('View ERC1155 NFT details', function () {
  const smartContract = SMART_CONTRACTS.ERC1155;

  it('user should be able to view ERC1155 NFT details', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC1155().build(),
        smartContract,
        title: this.test?.fullTitle(),
        testSpecificMock: mockIPFSRequest,
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);

        // Click to open the NFT details page and check displayed account
        await new Homepage(driver).goToNftTab();
        const nftListPage = new NftListPage(driver);
        await nftListPage.clickNFTIconOnActivityList();

        // Check the NFT details are correctly displayed on NFT details page
        const nftDetailsPage = new NFTDetailsPage(driver);
        await nftDetailsPage.check_pageIsLoaded();
        await nftDetailsPage.check_nftNameIsDisplayed('Rocks');
        await nftDetailsPage.check_nftDescriptionIsDisplayed(
          'This is a collection of Rock NFTs.',
        );
        await nftDetailsPage.check_nftImageContainerIsDisplayed();
        await nftDetailsPage.check_nftDetailsAddressIsDisplayed(
          '0x581c3...45947',
        );
      },
    );
  });
});
