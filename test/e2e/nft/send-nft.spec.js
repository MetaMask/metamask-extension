const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');
const FixtureBuilder = require('../fixture-builder');

describe('Send NFT', function () {
  const smartContract = SMART_CONTRACTS.NFTS;
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('should be able to send ERC721 NFT', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
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

        // After login, go to NFTs tab and import an NFT
        await driver.clickElement('[data-testid="home__nfts-tab"]');
        await driver.clickElement({ text: 'Import NFTs', tag: 'a' });

        await driver.fill('[data-testid="address"]', contractAddress);
        await driver.fill('[data-testid="token-id"]', '1');
        await driver.clickElement({ text: 'Add', tag: 'button' });

        // Fill the send NFT form and confirm the transaction
        await driver.clickElement('.nfts-items__item-image');
        await driver.clickElement({ text: 'Send', tag: 'button' });
        await driver.fill(
          'input[placeholder="Search, public address (0x), or ENS"]',
          '0xc427D562164062a23a5cFf596A4a3208e72Acd28',
        );
        await driver.clickElement({ text: 'Next', tag: 'button' });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // When transaction complete, check the send NFT is displayed in activity tab
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .transaction-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        const sendNftItem = await driver.findElement({
          css: 'h2',
          text: 'Send Test Dapp Collectibles',
        });
        assert.equal(await sendNftItem.isDisplayed(), true);

        // Go back to NFTs tab and check the imported NFT is shown as previously owned
        await driver.clickElement('[data-testid="home__nfts-tab"]');
        const previouslyOwnedNft = await driver.findElement({
          css: 'h5',
          text: 'Previously Owned',
        });
        assert.equal(await previouslyOwnedNft.isDisplayed(), true);
      },
    );
  });
});
