const { strict: assert } = require('assert');
const {
  withFixtures,
  completeImportSRPOnboardingFlow,
  WALLET_PASSWORD,
  TEST_SEED_PHRASE_TWO,
} = require('../../../helpers');
const FixtureBuilder = require('../../../fixture-builder');
const { GANACHE_ACCOUNT } = require('../../../constants');
const { setupAutoDetectMocking } = require('./mocks');

describe('NFT detection', function () {
  it('Should detect nfts after onboarding', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withNetworkControllerOnMainnet()
          .withPreferencesControllerNftDetectionEnabled()
          .build(),
        //   driverOptions,
        //  ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: async (mockServer) => {
          return setupAutoDetectMocking(mockServer, GANACHE_ACCOUNT);
        },
      },
      async ({ driver }) => {
        await driver.navigate();

        await completeImportSRPOnboardingFlow(
          driver,
          TEST_SEED_PHRASE_TWO,
          WALLET_PASSWORD,
        );

        const homePage = await driver.findElement('.home__main-view');
        const homePageDisplayed = await homePage.isDisplayed();

        assert.equal(homePageDisplayed, true);

        await driver.clickElement('[data-testid="home__nfts-tab"]');
        await driver.delay(1000);
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
  /*   it('displays NFT media', async function () {
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
        await driver.delay(1000);
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
  }); */
});
