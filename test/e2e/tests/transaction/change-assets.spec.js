const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  logInWithBalanceValidation,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');
const { tEn } = require('../../../lib/i18n-helpers');

describe('Change assets', function () {
  it('sends the correct asset when switching from native currency to NFT', async function () {
    const smartContract = SMART_CONTRACTS.NFTS;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC721().build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);

        // Wait for balance to load
        await driver.delay(500);

        // Click the Send button
        await driver.clickElement('[data-testid="eth-overview-send"]');

        // Chose a recipient
        await driver.clickElement('.multichain-account-list-item');

        // Populate an amount, continue
        await driver.clickElement('[data-testid="currency-input"]');
        await driver.press('[data-testid="currency-input"]', '2');
        await driver.clickElement({ text: 'Continue', css: 'button' });

        // Click edit
        await driver.clickElement(
          '[data-testid="wallet-initiated-header-back-button"]',
        );

        // Open the Amount modal
        await driver.clickElement('.asset-picker__symbol');

        // Choose an NFT instead
        await driver.clickElement({ css: 'button', text: 'NFTs' });
        await driver.clickElement('[data-testid="nft-default-image"]');

        // Validate that an NFT is chosen in the AssetAmountPicker
        await driver.waitForSelector({
          css: '.asset-picker__symbol',
          text: 'TDN',
        });
        await driver.waitForSelector({ css: 'p', text: '#1' });

        // Click continue
        await driver.assertElementNotPresent('.mm-modal-content');
        await driver.clickElement({ text: 'Continue', css: 'button' });

        // Ensure NFT is showing
        await driver.waitForSelector('[data-testid="nft-default-image"]');
        await driver.waitForSelector({
          css: 'h2',
          text: 'Test Dapp NFTs #1',
        });

        // Send it!
        await driver.clickElement({ text: 'Confirm', css: 'button' });

        // Ensure it was sent
        await driver.waitForSelector({
          css: 'p',
          text: 'Send Test Dapp NFTs #1',
        });
      },
    );
  });

  it('sends the correct asset when switching from ERC20 to NFT', async function () {
    const smartContract = SMART_CONTRACTS.NFTS;
    const tokenContract = SMART_CONTRACTS.HST;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withTokensControllerERC20()
          .withNftControllerERC721()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract: [smartContract, tokenContract],
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);

        // Click the Send button
        await driver.clickElement({
          css: '[data-testid="multichain-token-list-button"] p',
          text: 'TST',
        });

        // Wait for balance to load
        await driver.delay(500);

        await driver.clickElement('[data-testid="eth-overview-send"]');

        // Chose a recipient
        await driver.clickElement('.multichain-account-list-item');

        // Populate an amount, continue
        await driver.clickElement('[data-testid="currency-input"]');
        await driver.press('[data-testid="currency-input"]', '0');
        await driver.clickElement({ text: 'Continue', css: 'button' });

        // Click edit
        await driver.clickElement(
          '[data-testid="wallet-initiated-header-back-button"]',
        );

        // Open the Amount modal
        await driver.clickElement('.asset-picker__symbol');

        // Choose an NFT instead
        await driver.clickElement({ css: 'button', text: 'NFTs' });
        await driver.clickElement('[data-testid="nft-default-image"]');

        // Validate that an NFT is chosen in the AssetAmountPicker
        await driver.waitForSelector({
          css: '.asset-picker__symbol',
          text: 'TDN',
        });
        await driver.waitForSelector({ css: 'p', text: '#1' });

        // Click continue
        await driver.assertElementNotPresent('.mm-modal-content');
        await driver.clickElement({ text: 'Continue', css: 'button' });

        // Ensure NFT is showing
        await driver.waitForSelector('[data-testid="nft-default-image"]');
        await driver.waitForSelector({
          css: 'h2',
          text: 'Test Dapp NFTs #1',
        });

        // Send it!
        await driver.clickElement({ text: 'Confirm', css: 'button' });

        // Ensure it was sent
        await driver.waitForSelector({
          css: 'p',
          text: 'Send Test Dapp NFTs #1',
        });
      },
    );
  });

  it('sends the correct asset when switching from NFT to native currency', async function () {
    const smartContract = SMART_CONTRACTS.NFTS;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC721().build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);

        // Choose the nft
        await driver.clickElement('[data-testid="account-overview__nfts-tab"]');
        await driver.clickElement('[data-testid="nft-default-image"]');
        await driver.clickElement('[data-testid="nft-send-button"]');

        // Chose a recipient
        await driver.clickElement('.multichain-account-list-item');

        // Validate that an NFT is chosen in the AssetAmountPicker
        await driver.waitForSelector({
          css: '.asset-picker__symbol',
          text: 'TDN',
        });
        await driver.waitForSelector({ css: 'p', text: '#1' });
        await driver.clickElement({ text: 'Continue', css: 'button' });

        // Ensure NFT is showing
        await driver.waitForSelector('[data-testid="nft-default-image"]');
        await driver.waitForSelector({
          css: 'h2',
          text: 'Test Dapp NFTs #1',
        });

        // Click edit
        await driver.clickElement(
          '[data-testid="wallet-initiated-header-back-button"]',
        );

        // Open the Amount modal
        await driver.clickElement('.asset-picker__symbol');

        // Choose tokens
        await driver.clickElement({ css: 'button', text: 'Tokens' });
        await driver.clickElement(
          '[data-testid="multichain-token-list-button"]',
        );

        // Ensure correct token selected
        await driver.waitForSelector({
          css: '.asset-picker__symbol',
          text: 'ETH',
        });

        // Populate an amount, continue
        await driver.clickElement('[data-testid="currency-input"]');
        await driver.press('[data-testid="currency-input"]', '2');
        await driver.assertElementNotPresent('.mm-modal-content');
        await driver.clickElement({ text: 'Continue', css: 'button' });

        // Validate the send amount
        await driver.waitForSelector({
          css: 'h2',
          text: '2',
        });

        // Send it!
        await driver.clickElement({ text: 'Confirm', css: 'button' });

        // Ensure it was sent
        await driver.waitForSelector({ css: 'p', text: 'Send' });
        await driver.waitForSelector({
          css: '[data-testid="transaction-list-item-primary-currency"]',
          text: '-2 ETH',
        });
      },
    );
  });

  it('changes to native currency when switching accounts during a NFT send', async function () {
    const smartContract = SMART_CONTRACTS.NFTS;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNftControllerERC721()
          .withPreferencesController({
            featureFlags: {
              sendHexData: true,
            },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);

        // Create second account
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-add-account"]',
        );
        await driver.fill('[placeholder="Account 2"]', 'Account 2');
        await driver.clickElement({ text: tEn('addAccount'), tag: 'button' });

        // Go back to Account 1
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement({
          css: `.multichain-account-list-item .multichain-account-list-item__account-name__button`,
          text: 'Account 1',
        });

        // Choose the nft
        await driver.clickElement('[data-testid="account-overview__nfts-tab"]');
        await driver.clickElement('[data-testid="nft-default-image"]');
        await driver.clickElement('[data-testid="nft-send-button"]');

        // Chose a recipient
        await driver.clickElement('.multichain-account-list-item');

        // Validate that an NFT is chosen in the AssetAmountPicker
        await driver.waitForSelector({
          css: '.asset-picker__symbol',
          text: 'TDN',
        });
        await driver.waitForSelector({ css: 'p', text: '#1' });

        // Switch to Account 2
        await driver.clickElement('[data-testid="send-page-account-picker"]');
        await driver.clickElement({
          css: `.multichain-account-list-item .multichain-account-list-item__account-name__button`,
          text: 'Account 2',
        });

        // Ensure that the AssetPicker shows native currency and 0 value
        await driver.waitForSelector({
          css: '.asset-picker__symbol',
          text: 'ETH',
        });

        // Go back to Account 1
        await driver.clickElement('[data-testid="send-page-account-picker"]');
        await driver.clickElement({
          css: `.multichain-account-list-item .multichain-account-list-item__account-name__button`,
          text: 'Account 1',
        });

        // Ensure that the AssetPicker shows native currency and 0 value
        await driver.waitForSelector({
          css: '.asset-picker__symbol',
          text: 'ETH',
        });

        // Populate an amount, continue
        await driver.clickElement('[data-testid="currency-input"]');
        await driver.press('[data-testid="currency-input"]', '2');

        // Make sure hex data is cleared after switching assets
        const hexDataLocator = await driver.findElement(
          '[data-testid="send-hex-textarea"]',
        );
        const hexDataValue = await hexDataLocator.getProperty('value');
        assert.equal(
          hexDataValue,
          '',
          'Hex data has not been cleared after switching assets.',
        );

        // Make sure gas is updated by resetting amount and hex data
        // Note: this is needed until the race condition is fixed on the wallet level (issue #25243)
        await driver.fill('[data-testid="currency-input"]', '2.000042');
        await hexDataLocator.fill('0x');
        await hexDataLocator.fill('');

        // Go to the last confirmation screen
        await driver.clickElement({ text: 'Continue', css: 'button' });

        // Validate the send amount
        await driver.waitForSelector({
          css: 'h2',
          text: '2 ETH',
        });
      },
    );
  });
});
