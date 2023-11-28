const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  unlockWallet,
} = require('../../helpers');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');
const FixtureBuilder = require('../../fixture-builder');

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
        fixtures: new FixtureBuilder().withNftControllerERC721().build(),
        ganacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Fill the send NFT form and confirm the transaction
        await driver.clickElement('[data-testid="home__nfts-tab"]');
        await driver.clickElement('.nft-item__container');
        // TODO: Update Test when Multichain Send Flow is added
        if (process.env.MULTICHAIN) {
          return;
        }
        await driver.clickElement({ text: 'Send', tag: 'button' });
        await driver.fill(
          'input[placeholder="Enter public address (0x) or ENS name"]',
          '0xc427D562164062a23a5cFf596A4a3208e72Acd28',
        );
        await driver.clickElement({ text: 'Next', tag: 'button' });

        // Edit the NFT, ensure same address, and move forward
        await driver.clickElement(
          '[data-testid="confirm-page-back-edit-button"]',
        );

        const recipient = await driver.findElement(
          '.ens-input__selected-input__title',
        );

        assert.equal(
          await recipient.getText(),
          '0xc427d562164062a23a5cff596a4a3208e72acd28',
        );

        await driver.clickElement({ text: 'Next', tag: 'button' });

        // Confirm the send
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // When transaction complete, check the send NFT is displayed in activity tab
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        const sendNftItem = await driver.findElement({
          css: '[data-testid="activity-list-item-action"]',
          text: 'Send Test Dapp NFTs',
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
