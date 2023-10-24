const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { setupAutoDetectMocking } = require('./mocks');

describe('NFT detection', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('displays NFT media', async function () {
    const driverOptions = { mock: true };
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPreferencesControllerNftDetectionEnabled()
          .build(),
        driverOptions,
        ganacheOptions,
        title: this.test.title,
        testSpecificMock: setupAutoDetectMocking,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
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
