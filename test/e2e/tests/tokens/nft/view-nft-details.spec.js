const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../../../helpers');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');
const FixtureBuilder = require('../../../fixture-builder');

describe('View NFT details', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  it('user should be able to view ERC721 NFT details', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC721().build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Click to open the NFT details page and check title
        await driver.clickElement('[data-testid="account-overview__nfts-tab"]');
        await driver.clickElement('.nft-item__container');

        await driver.findElement('[data-testid="nft__back"]');

        // Check the displayed NFT details

        await driver.findElement({
          css: '[data-testid="nft-details__name"]',
          text: 'Test Dapp NFTs #1',
        });

        await driver.findElement({
          css: '[data-testid="nft-details__description"]',
          text: 'Test Dapp NFTs for testing.',
        });

        const nftImage = await driver.findElement('.nft-item__container');
        assert.equal(await nftImage.isDisplayed(), true);

        await driver.findElement({
          css: '.nft-details__addressButton',
          text: '0x581c3...45947',
        });
      },
    );
  });
});
