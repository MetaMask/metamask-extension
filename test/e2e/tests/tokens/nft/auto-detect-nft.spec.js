const { strict: assert } = require('assert');
const {
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
} = require('../../../helpers');
const FixtureBuilder = require('../../../fixture-builder');
const { setupAutoDetectMocking } = require('./mocks');

describe('NFT detection', function () {
  /**
   * TODO Revisit this test once we enable nft auto detection by default. Use .withPreferencesControllerNftDetectionEnabled().
   */
  it('displays NFT media', async function () {
    const driverOptions = { mock: true };
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withNetworkControllerOnMainnet().build(),
        driverOptions,
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: setupAutoDetectMocking,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // go to settings
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        // fix race condition with mmi build
        if (process.env.MMI) {
          await driver.waitForSelector(
            '[data-testid="global-menu-mmi-portfolio"]',
          );
        }

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Security & privacy', tag: 'div' });
        await driver.clickElement(
          '[data-testid="useNftDetection"] .toggle-button > div',
        );
        await driver.clickElement(
          '.settings-page__header__title-container__close-button',
        );
        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );

        await driver.clickElement('[data-testid="account-overview__nfts-tab"]');
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
});
