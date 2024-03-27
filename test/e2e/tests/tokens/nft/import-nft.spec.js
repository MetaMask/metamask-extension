const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  findAnotherAccountFromAccountList,
  waitForAccountRendered,
} = require('../../../helpers');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');
const FixtureBuilder = require('../../../fixture-builder');

describe('Import NFT', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  it('should be able to import an NFT that user owns', async function () {
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

        // Enter a valid NFT that belongs to user and check success message appears
        await driver.fill('#address', contractAddress);
        await driver.fill('#token-id', '1');
        await driver.clickElement(
          '[data-testid="import-nfts-modal-import-button"]',
        );

        const newNftNotification = await driver.findElement({
          text: 'NFT was successfully added!',
          tag: 'h6',
        });
        assert.equal(await newNftNotification.isDisplayed(), true);

        // Check the imported NFT and its image are displayed in the NFT tab
        const importedNft = await driver.waitForSelector({
          css: 'h5',
          text: 'TestDappNFTs',
        });
        const importedNftImage = await driver.findElement(
          '.nft-item__container',
        );
        assert.equal(await importedNft.isDisplayed(), true);
        assert.equal(await importedNftImage.isDisplayed(), true);
      },
    );
  });

  it('should continue to display an imported NFT after importing, adding a new account, and switching back', async function () {
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

        // Enter a valid NFT that belongs to user and check success message appears
        await driver.fill('#address', contractAddress);
        await driver.fill('#token-id', '1');
        await driver.clickElement(
          '[data-testid="import-nfts-modal-import-button"]',
        );

        const newNftNotification = await driver.findElement({
          text: 'NFT was successfully added!',
          tag: 'h6',
        });
        assert.equal(await newNftNotification.isDisplayed(), true);

        // Check the imported NFT and its image are displayed in the NFT tab
        const importedNft = await driver.waitForSelector({
          css: 'h5',
          text: 'TestDappNFTs',
        });
        const importedNftImage = await driver.findElement(
          '.nft-item__container',
        );
        assert.equal(await importedNft.isDisplayed(), true);
        assert.equal(await importedNftImage.isDisplayed(), true);

        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.clickElement({ text: 'Add a new account', tag: 'button' });

        // set account name
        await driver.fill('[placeholder="Account 2"]', '2nd account');
        await driver.delay(400);
        await driver.clickElement({ text: 'Create', tag: 'button' });

        await driver.isElementPresent({
          tag: 'span',
          text: '2nd account',
        });

        const accountOneSelector = await findAnotherAccountFromAccountList(
          driver,
          1,
          'Account 1',
        );
        await waitForAccountRendered(driver);
        await driver.clickElement(accountOneSelector);

        const nftIsStillDisplayed = await driver.isElementPresentAndVisible({
          css: 'h5',
          text: 'TestDappNFTs',
        });
        const nftImageIsStillDisplayed =
          await driver.isElementPresentAndVisible('.nft-item__container');
        assert.equal(
          nftIsStillDisplayed,
          true,
          'Nft is no longer displayed after adding an account and switching back to account 1',
        );
        assert.equal(
          nftImageIsStillDisplayed,
          true,
          'Nft image is no longer displayed after adding an account and switching back to account 1',
        );
      },
    );
  });

  it('should not be able to import an NFT that does not belong to user', async function () {
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
        await driver.fill('#token-id', '2');
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
