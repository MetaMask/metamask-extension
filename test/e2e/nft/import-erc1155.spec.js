const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');
const FixtureBuilder = require('../fixture-builder');

describe('Import ERC1155 NFT', function () {
  const smartContract = SMART_CONTRACTS.ERC1155;
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('should be able to import an ERC1155 NFT that user owns', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        smartContract,
        title: this.test.title,
      },
      async ({ driver, _, contractRegistry }) => {
        const contractAddress =
          contractRegistry.getContractAddress(smartContract);
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // After login, go to NFTs tab, open the import NFT/ERC1155 form
        await driver.clickElement('[data-testid="home__nfts-tab"]');
        await driver.clickElement({ text: 'Import NFTs', tag: 'a' });

        // Enter a valid NFT that belongs to user and check success message appears
        await driver.fill('[data-testid="address"]', contractAddress);
        await driver.fill('[data-testid="token-id"]', '1');
        await driver.clickElement({ text: 'Add', tag: 'button' });

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
          '.nfts-items__item img',
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
        ganacheOptions,
        smartContract,
        title: this.test.title,
      },
      async ({ driver, _, contractRegistry }) => {
        const contractAddress =
          contractRegistry.getContractAddress(smartContract);
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // After login, go to NFTs tab, open the import NFT form
        await driver.clickElement('[data-testid="home__nfts-tab"]');
        await driver.clickElement({ text: 'Import NFTs', tag: 'a' });

        // Enter an NFT that not belongs to user with a valid address and an invalid token id
        await driver.fill('[data-testid="address"]', contractAddress);
        await driver.fill('[data-testid="token-id"]', '4');
        await driver.clickElement({ text: 'Add', tag: 'button' });

        // Check error message appears
        const invalidNftNotification = await driver.findElement({
          text: 'NFT can’t be added as the ownership details do not match. Make sure you have entered correct information.',
          tag: 'h6',
        });
        assert.equal(await invalidNftNotification.isDisplayed(), true);
      },
    );
  });
});
