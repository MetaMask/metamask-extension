const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../../../helpers');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');
const FixtureBuilder = require('../../../fixture-builder');

async function mockIPFSRequest(mockServer) {
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
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
        testSpecificMock: mockIPFSRequest,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Click to open the NFT details page and check displayed account
        await driver.clickElement('[data-testid="home__nfts-tab"]');

        await driver.clickElement('.nft-item__container');

        await driver.findElement({
          css: '.asset-breadcrumb span:nth-of-type(2)',
          text: 'Account 1',
        });

        // Check the displayed ERC1155 NFT details
        await driver.findElement({
          css: '.nft-details__info h4',
          text: 'Rocks',
        });

        await driver.findElement({
          css: '.nft-details__info h6:nth-of-type(2)',
          text: 'This is a collection of Rock NFTs.',
        });

        await driver.findVisibleElement('.nft-item__container');

        await driver.findElement({
          css: '.nft-details__contract-wrapper',
          text: '0x581c3...45947',
        });
      },
    );
  });
});
