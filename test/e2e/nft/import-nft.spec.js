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

        // After login, go to NFTs tab, fill the form to import NFT
        await driver.clickElement('[data-testid="home__nfts-tab"]');
        await driver.clickElement({ text: 'Import NFTs', tag: 'a' });

        await driver.fill('[data-testid="address"]', contractAddress);
        await driver.fill('[data-testid="token-id"]', '1');
        await driver.clickElement({ text: 'Add', tag: 'button' });

        // Check that notification message for added NFT is displayed
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
