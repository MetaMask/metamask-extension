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
  it('Shows nft default image when IPFS toggle is off and restore image once we toggle the ipfs modal', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC1155().build(),
        defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Security & privacy', tag: 'div' });

        await driver.clickElement('[data-testid="setting-ipfs-gateway"] label');
        await driver.clickElement(
          '.settings-page__header__title-container__close-button',
        );
        await driver.clickElement('[data-testid="home__nfts-tab"]');
        const importedNftImage = await driver.findVisibleElement(
          '.nft-item__container',
        );
        await importedNftImage.click();
        // check for default image
        const nftDefaultImage = await driver.findElement(
          '[data-testid=nft-default-image]',
        );
        assert.equal(await nftDefaultImage.isDisplayed(), true);

        // check for show button on default image
        await driver.clickElement({
          text: 'Show',
          tag: 'button',
        });
        const toggleIpfsModal = await driver.findElement('.toggle-ipfs-modal');
        assert.equal(await toggleIpfsModal.isDisplayed(), true);

        // Toggle on ipfs when click on confirm button in modal
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });
        // should render image now
        const nftImage = await driver.findVisibleElement(
          '[data-testid="nft-image"]',
        );
        assert.equal(await nftImage.isDisplayed(), true);
      },
    );
  });
});
