import { strict as assert } from 'assert';
import { MockttpServer } from 'mockttp';
import { withFixtures, getEventPayloads } from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import FixtureBuilder from '../../../fixture-builder';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { MOCK_META_METRICS_ID } from '../../../constants';
import Homepage from '../../../page-objects/pages/home/homepage';
import NFTDetailsPage from '../../../page-objects/pages/nft-details-page';
import NftListPage from '../../../page-objects/pages/home/nft-list';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';

async function mockedNftRemoved(mockServer: MockttpServer) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: MetaMetricsEventName.NFTRemoved }],
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

describe('Remove NFT', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  it('user should be able to remove ERC721 NFT on details page and removeNft event should be emitted', async function () {
    async function mockSegment(mockServer: MockttpServer) {
      return [await mockedNftRemoved(mockServer)];
    }
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNftControllerERC721()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        smartContract,
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({
        driver,
        localNodes,
        mockedEndpoint: mockedEndpoints,
        contractRegistry,
      }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);

        const contractAddress =
          await contractRegistry.getContractAddress(smartContract);

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

        // Check if event was emitted
        const events = await getEventPayloads(driver, mockedEndpoints);
        const nftRemovedProperties = events[0].properties;
        assert.equal(
          nftRemovedProperties.token_contract_address,
          contractAddress,
        );
        assert.equal(nftRemovedProperties.tokenId, '1');
        assert.equal(nftRemovedProperties.asset_type, 'NFT');
        assert.equal(nftRemovedProperties.token_standard, 'ERC721');
        assert.equal(nftRemovedProperties.token_standard, 'ERC721');
        assert.equal(nftRemovedProperties.isSuccessful, true);
        assert.equal(nftRemovedProperties.chain_id, CHAIN_IDS.LOCALHOST);
      },
    );
  });
});
