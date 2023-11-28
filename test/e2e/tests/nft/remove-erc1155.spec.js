const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  unlockWallet,
} = require('../../helpers');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');
const FixtureBuilder = require('../../fixture-builder');

async function mockIPFSRequest(mockServer) {
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
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('user should be able to remove ERC1155 NFT on details page', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC1155().build(),
        ganacheOptions,
        smartContract,
        title: this.test.fullTitle(),
        testSpecificMock: mockIPFSRequest,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Open the details page and click remove nft button
        await driver.clickElement('[data-testid="home__nfts-tab"]');
        await driver.clickElement('[data-testid="nft-image"]');
        await driver.clickElement('[data-testid="nft-options__button"]');
        await driver.clickElement('[data-testid="nft-item-remove"]');

        // Check the remove NFT toaster is displayed
        const removeNftNotification = await driver.findElement({
          text: 'NFT was successfully removed!',
          tag: 'h6',
        });
        assert.equal(await removeNftNotification.isDisplayed(), true);

        // Check the imported ERC1155 NFT disappeared in the NFT tab
        const noNftInfo = await driver.waitForSelector({
          css: 'h4',
          text: 'No NFTs yet',
        });
        assert.equal(await noNftInfo.isDisplayed(), true);
      },
    );
  });
});
