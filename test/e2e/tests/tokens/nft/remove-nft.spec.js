const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  getEventPayloads,
} = require('../../../helpers');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');
const FixtureBuilder = require('../../../fixture-builder');
const {
  MetaMetricsEventName,
} = require('../../../../../shared/constants/metametrics');
const { CHAIN_IDS } = require('../../../../../shared/constants/network');

async function mockedNftRemoved(mockServer) {
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
    async function mockSegment(mockServer) {
      return [await mockedNftRemoved(mockServer)];
    }
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNftControllerERC721()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints, contractRegistry }) => {
        await unlockWallet(driver);

        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );

        // Open the details and click remove nft button
        await driver.clickElement('[data-testid="account-overview__nfts-tab"]');
        await driver.clickElement('.nft-item__container');
        await driver.clickElement('[data-testid="nft-options__button"]');
        await driver.clickElement('[data-testid="nft-item-remove"]');

        // Check the remove NFT toaster is displayed
        const removeNftNotification = await driver.findElement({
          text: 'NFT was successfully removed!',
          tag: 'h6',
        });
        assert.equal(await removeNftNotification.isDisplayed(), true);

        // Check the imported NFT disappeared in the NFT tab
        const noNftInfo = await driver.waitForSelector({
          css: 'h4',
          text: 'No NFTs yet',
        });
        assert.equal(await noNftInfo.isDisplayed(), true);

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
