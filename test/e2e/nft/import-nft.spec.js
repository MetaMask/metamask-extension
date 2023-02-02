const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');
const FixtureBuilder = require('../fixture-builder');

describe('Import NFT', function () {
  const smartContract = SMART_CONTRACTS.COLLECTIBLES;
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('user should be able to import an NFT', async function () {
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

        // After login, go to NFTs tab, open the form to import NFT
        await driver.clickElement('[data-testid="home__nfts-tab"]');
        await driver.clickElement({ text: 'Import NFTs', tag: 'a' });
        const nftAddressField = await driver.findElement(
          '[data-testid="address"]',
        );
        const nftTokenIdField = await driver.findElement(
          '[data-testid="token-id"]',
        );

        // Enter an NFT that not belongs to user and check error message appears
        await nftAddressField.sendKeys(
          '0x932Ca55B9Ef0b3094E8Fa82435b3b4c50d713043',
        );
        await nftTokenIdField.sendKeys('927');
        await driver.clickElement({ text: 'Add', tag: 'button' });

        const invalidNftNotification = await driver.findElement({
          text: 'NFT can’t be added as the ownership details do not match. Make sure you have entered correct information.',
          tag: 'h6',
        });
        assert.equal(await invalidNftNotification.isDisplayed(), true);

        // Enter the valid NFT that belongs to user and check success message appears
        await nftAddressField.clear();
        await nftAddressField.sendKeys(contractAddress);
        await nftTokenIdField.clear();
        await nftTokenIdField.sendKeys('1');
        await driver.clickElement({ text: 'Add', tag: 'button' });

        const newNftNotification = await driver.findElement({
          text: 'Collectible was successfully added!',
          tag: 'h6',
        });
        assert.equal(await newNftNotification.isDisplayed(), true);

        // Check the imported NFT and its image are displayed in the NFT tab
        const importedNft = await driver.findElement({
          xpath: "//h5[contains(text(), 'TestDappCollectibles')]",
        });
        const importedNftImage = await driver.findElement(
          '.collectibles-items__item-image',
        );
        assert.equal(await importedNft.isDisplayed(), true);
        assert.equal(await importedNftImage.isDisplayed(), true);
      },
    );
  });
});
