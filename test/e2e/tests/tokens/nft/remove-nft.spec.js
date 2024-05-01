const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../../../helpers');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');
const FixtureBuilder = require('../../../fixture-builder');

describe('Remove NFT', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  it('user should be able to remove ERC721 NFT on details page', async function () {
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

        // Open the details and click remove nft button
        await driver.clickElement('[data-testid="home__nfts-tab"]');
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
      },
    );
  });
});
