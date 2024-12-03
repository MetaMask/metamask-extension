const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  logInWithBalanceValidation,
  unlockWallet,
  withFixtures,
  tempToggleSettingRedesignedTransactionConfirmations,
} = require('../../../helpers');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');
const FixtureBuilder = require('../../../fixture-builder');

describe('Send NFT', function () {
  const smartContract = SMART_CONTRACTS.NFTS;
  const erc1155SmartContract = SMART_CONTRACTS.ERC1155;

  it('should be able to send ERC721 NFT', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC721().build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await tempToggleSettingRedesignedTransactionConfirmations(driver);

        // Fill the send NFT form and confirm the transaction
        await driver.clickElement('[data-testid="account-overview__nfts-tab"]');
        await driver.clickElement('.nft-item__container');
        // TODO: Update Test when Multichain Send Flow is added
        await driver.clickElement({ text: 'Send', tag: 'button' });
        await driver.fill(
          'input[placeholder="Enter public address (0x) or domain name"]',
          '0xc427D562164062a23a5cFf596A4a3208e72Acd28',
        );
        await driver.clickElement({
          text: 'Continue',
          tag: 'button',
        });

        // Edit the NFT, ensure same address, and move forward
        await driver.clickElement(
          '[data-testid="confirm-page-back-edit-button"]',
        );

        const recipient = await driver.findElement(
          '.ens-input__selected-input__title',
        );

        assert.equal(
          await recipient.getText(),
          '0xc427D...Acd28\n0xc427D...Acd28',
        );

        await driver.clickElement({
          text: 'Continue',
          tag: 'button',
        });

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
        await driver.clickElement('[data-testid="account-overview__nfts-tab"]');
        const previouslyOwnedNft = await driver.findElement({
          css: 'h5',
          text: 'Previously Owned',
        });
        assert.equal(await previouslyOwnedNft.isDisplayed(), true);
      },
    );
  });

  it('should be able to send ERC1155 NFT', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC1155().build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract: erc1155SmartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);

        // Fill the send NFT form and confirm the transaction
        await driver.clickElement('[data-testid="account-overview__nfts-tab"]');

        await driver.clickElement('[data-testid="nft-network-badge"]');

        await driver.clickElement({ text: 'Send', tag: 'button' });
        await driver.fill(
          'input[placeholder="Enter public address (0x) or domain name"]',
          '0xc427D562164062a23a5cFf596A4a3208e72Acd28',
        );

        await driver.fill('input[placeholder="0"]', '1');

        await driver.clickElement({
          text: 'Continue',
          tag: 'button',
        });

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
          text: 'Safe transfer from',
        });
        assert.equal(await sendNftItem.isDisplayed(), true);

        // Go back to NFTs tab and check the imported NFT is shown as previously owned
        await driver.clickElement('[data-testid="account-overview__nfts-tab"]');

        const previouslyOwnedNft = await driver.findElement({
          css: 'h5',
          text: 'Previously Owned',
        });
        assert.equal(await previouslyOwnedNft.isDisplayed(), true);
      },
    );
  });

  it('should not be able to send ERC1155 NFT with invalid amount', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC1155().build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract: erc1155SmartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);

        // Fill the send NFT form and confirm the transaction
        await driver.clickElement('[data-testid="account-overview__nfts-tab"]');

        await driver.clickElement('[data-testid="nft-network-badge"]');

        await driver.clickElement({ text: 'Send', tag: 'button' });

        await driver.fill(
          'input[placeholder="Enter public address (0x) or domain name"]',
          '0xc427D562164062a23a5cFf596A4a3208e72Acd28',
        );

        await driver.assertElementNotPresent(
          '[data-testid="send-page-amount-error"]',
        );
        await driver.fill('input[placeholder="0"]', '0');
        assert.ok(
          await driver.findElement({
            text: '1 token. Cannot send negative or zero amounts of asset.',
            tag: 'p',
          }),
        );
      },
    );
  });
});
