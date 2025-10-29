import { strict as assert } from 'assert';
import { withFixtures, getEventPayloads } from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import FixtureBuilder from '../../../fixture-builder';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { MOCK_META_METRICS_ID } from '../../../constants';
import Homepage from '../../../page-objects/pages/home/homepage';
import NFTDetailsPage from '../../../page-objects/pages/nft-details-page';
import NftListPage from '../../../page-objects/pages/home/nft-list';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';

describe('Remove NFT', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  it('user should be able to remove ERC721 NFT on details page and removeNft event should be emitted', async function () {
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
        await nftDetailsPage.checkPageIsLoaded();
        await nftDetailsPage.removeNFT();

        // Check the success remove NFT toaster is displayed and the NFT is removed from the NFT tab
        await nftListPage.checkSuccessRemoveNftMessageIsDisplayed();
        await nftListPage.checkNoNftInfoIsDisplayed();

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
