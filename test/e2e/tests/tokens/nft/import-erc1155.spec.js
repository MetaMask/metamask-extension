const { strict: assert } = require('assert');
const {
  withFixtures,
  unlockWallet,
  defaultGanacheOptions,
} = require('../../../helpers');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');
const FixtureBuilder = require('../../../fixture-builder');

describe('Import ERC1155 NFT', function () {
  const smartContract = SMART_CONTRACTS.ERC1155;

  it('should be able to import an ERC1155 NFT that user owns', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, _, contractRegistry }) => {
        const contractAddress =
          contractRegistry.getContractAddress(smartContract);
        await unlockWallet(driver);

        // After login, go to NFTs tab, open the import NFT/ERC1155 form
        await driver.clickElement('[data-testid="home__nfts-tab"]');
        await driver.clickElement({ text: 'Import NFT', tag: 'button' });

        // Enter a valid NFT that belongs to user and check success message appears
        await driver.fill('#address', contractAddress);
        await driver.fill('#token-id', '1');
        await driver.clickElement(
          '[data-testid="import-nfts-modal-import-button"]',
        );

        const newNftNotification = await driver.findVisibleElement({
          text: 'NFT was successfully added!',
          tag: 'h6',
        });
        assert.equal(await newNftNotification.isDisplayed(), true);

        // Check the imported ERC1155 and its image are displayed in the ERC1155 tab
        const importedERC1155 = await driver.waitForSelector({
          css: 'h5',
          text: 'Unnamed collection',
        });
        assert.equal(await importedERC1155.isDisplayed(), true);

        const importedERC1155Image = await driver.findVisibleElement(
          '.nft-item__container',
        );
        assert.equal(await importedERC1155Image.isDisplayed(), true);
      },
    );
  });

  it('should not be able to import an ERC1155 NFT that does not belong to user', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, _, contractRegistry }) => {
        const contractAddress =
          contractRegistry.getContractAddress(smartContract);
        await unlockWallet(driver);

        // After login, go to NFTs tab, open the import NFT form
        await driver.clickElement('[data-testid="home__nfts-tab"]');
        await driver.clickElement({ text: 'Import NFT', tag: 'button' });

        // Enter an NFT that not belongs to user with a valid address and an invalid token id
        await driver.fill('#address', contractAddress);
        await driver.fill('#token-id', '4');
        await driver.clickElement(
          '[data-testid="import-nfts-modal-import-button"]',
        );
        // Check error message appears
        const invalidNftNotification = await driver.findElement({
          text: 'NFT can’t be added as the ownership details do not match. Make sure you have entered correct information.',
          tag: 'p',
        });
        assert.equal(await invalidNftNotification.isDisplayed(), true);
      },
    );
  });
});
