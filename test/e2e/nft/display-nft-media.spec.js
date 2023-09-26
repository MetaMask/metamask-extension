const { strict: assert } = require('assert');
const {
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');

describe('Settings', function () {
  const smartContract = SMART_CONTRACTS.ERC1155;
  it('Shows nft default image when display nft media toggle is off and shows the image when the toggle is on', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC1155().build(),
        defaultGanacheOptions,
        smartContract,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Security & privacy', tag: 'div' });

        await driver.clickElement('[data-testid="enableOpenSeaAPI"]');
        await driver.clickElement(
          '.settings-page__header__title-container__close-button',
        );
        await driver.clickElement('[data-testid="home__nfts-tab"]');
        const nftDefaultImage1 = await driver.findElement(
          '[data-testid=nft-default-image]',
        );
        assert.equal(await nftDefaultImage1.isDisplayed(), true);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Security & privacy', tag: 'div' });

        await driver.clickElement('[data-testid="enableOpenSeaAPI"] label');
        await driver.clickElement(
          '.settings-page__header__title-container__close-button',
        );
        await driver.clickElement('[data-testid="home__nfts-tab"]');

        // should render image now
        const nftImage = await driver.findVisibleElement(
          '[data-testid="nft-image"]',
        );
        assert.equal(await nftImage.isDisplayed(), true);
      },
    );
  });
});
