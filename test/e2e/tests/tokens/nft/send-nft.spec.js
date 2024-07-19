const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  logInWithBalanceValidation,
  unlockWallet,
  withFixtures,
} = require('../../../helpers');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');
const FixtureBuilder = require('../../../fixture-builder');
import HomePage from '../../../page-objects/pages/homepage';

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

        // Fill the send NFT form and confirm the transaction
        await driver.clickElement('[data-testid="account-overview__nfts-tab"]');
        await driver.clickElement('.nft-item__container');
        // TODO: Update Test when Multichain Send Flow is added
        await driver.clickElement({ text: 'Send', tag: 'button' });
        await driver.fill(
          'input[placeholder="Enter public address (0x) or ENS name"]',
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
        const homePage = new HomePage(driver);
        await homePage.check_confirmedTxNumberDisplayedInActivity();
        await homePage.check_txActionNameInActivity('Send Test Dapp NFTs #1');

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
        await driver.clickElement(
          '.nft-item__container .mm-badge-wrapper__badge-container',
        );

        await driver.clickElement({ text: 'Send', tag: 'button' });
        await driver.fill(
          'input[placeholder="Enter public address (0x) or ENS name"]',
          '0xc427D562164062a23a5cFf596A4a3208e72Acd28',
        );

        await driver.fill('input[placeholder="0"]', '1');

        await driver.clickElement({
          text: 'Continue',
          tag: 'button',
        });

        // Ensure that this type of NFT is not editable for now
        // https://github.com/MetaMask/metamask-extension/issues/24320
        const editButtonPresent = await driver.isElementPresent(
          '[data-testid="confirm-page-back-edit-button"]',
        );
        assert.equal(editButtonPresent, false);

        // Confirm the send
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // When transaction complete, check the send NFT is displayed in activity tab
        const homePage = new HomePage(driver);
        await homePage.check_confirmedTxNumberDisplayedInActivity();
        await homePage.check_txActionNameInActivity('Safe transfer from');

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
          'input[placeholder="Enter public address (0x) or ENS name"]',
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
