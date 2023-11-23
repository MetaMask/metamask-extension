const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');
const { setupAutoDetectMocking } = require('./mocks');

describe('NFT detection', function () {
  it('displays NFT media', async function () {
    const driverOptions = { mock: true };
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPreferencesControllerNftDetectionEnabled()
          .build(),
        driverOptions,
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: setupAutoDetectMocking,
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await driver.clickElement('[data-testid="home__nfts-tab"]');
        const collection = await driver.findElement(
          '[data-testid="collection-expander-button"]',
        );
        const nftImage = await driver.findElement('[data-testid="nft-item"]');
        assert.equal(
          await collection.getText(),
          'ENS: Ethereum Name Service (1)',
        );
        assert.equal(await nftImage.isDisplayed(), true);
      },
    );
  });
});
