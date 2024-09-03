import { strict as assert } from 'assert';
import {
  defaultGanacheOptions,
  withFixtures,
  logInWithBalanceValidation,
} from '../../helpers';
import { GanacheServer } from '../../services/ganache';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { tEn } from '../../../lib/i18n-helpers';
import { TransactionPage } from '../../page-objects/transaction-page';
import { Driver } from '../../webdriver/driver';

// Dynamic import for FixtureBuilder
const getFixtureBuilder = async () => {
  const { default: FixtureBuilder } = await import('../../fixture-builder');
  return FixtureBuilder;
};

describe('Change assets', function () {
  it('sends the correct asset when switching from native currency to NFT', async function () {
    const FixtureBuilder = await getFixtureBuilder();
    const smartContract = SMART_CONTRACTS.NFTS;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC721().build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer: GanacheServer;
      }) => {
        const transactionPage = new TransactionPage(driver);

        await logInWithBalanceValidation(driver, ganacheServer);

        // Wait for balance to load
        await driver.delay(500);

        await transactionPage.clickSendButton();
        await transactionPage.selectRecipient();
        await transactionPage.enterAmount('2');
        await transactionPage.clickContinue();

        await transactionPage.check_transactionAmount('2.000042');
        await transactionPage.clickEdit();

        await transactionPage.openAssetPicker();
        await transactionPage.selectNFTTab();
        await transactionPage.selectNFT();

        await transactionPage.check_nftSelected('TDN', '#1');
        await transactionPage.clickContinue();

        await transactionPage.check_nftDisplayed('Test Dapp NFTs #1');
        await transactionPage.clickConfirm();

        await transactionPage.check_transactionStatus('Send Test Dapp NFTs #1');
      },
    );
  });

  it('sends the correct asset when switching from ERC20 to NFT', async function () {
    const FixtureBuilder = await getFixtureBuilder();
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
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer: GanacheServer;
      }) => {
        const transactionPage = new TransactionPage(driver);

        await logInWithBalanceValidation(driver, ganacheServer);

        await driver.clickElement({
          css: '[data-testid="multichain-token-list-button"] span',
          text: 'TST',
        });

        await driver.delay(500);

        await transactionPage.clickSendButton();
        await transactionPage.selectRecipient();
        await transactionPage.enterAmount('0');
        await transactionPage.clickContinue();

        await transactionPage.check_transactionAmount('0.00008455');
        await transactionPage.clickEdit();

        await transactionPage.openAssetPicker();
        await transactionPage.selectNFTTab();
        await transactionPage.selectNFT();

        await transactionPage.check_nftSelected('TDN', '#1');
        await transactionPage.clickContinue();

        await transactionPage.check_nftDisplayed('Test Dapp NFTs #1');
        await transactionPage.clickConfirm();

        await transactionPage.check_transactionStatus('Send Test Dapp NFTs #1');
      },
    );
  });

  it('sends the correct asset when switching from NFT to native currency', async function () {
    const FixtureBuilder = await getFixtureBuilder();
    const smartContract = SMART_CONTRACTS.NFTS;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC721().build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer: GanacheServer;
      }) => {
        const transactionPage = new TransactionPage(driver);

        await logInWithBalanceValidation(driver, ganacheServer);

        await driver.clickElement('[data-testid="account-overview__nfts-tab"]');
        await driver.clickElement('[data-testid="nft-default-image"]');
        await driver.clickElement('[data-testid="nft-send-button"]');

        await transactionPage.selectRecipient();
        await transactionPage.check_nftSelected('TDN', '#1');
        await transactionPage.clickContinue();

        await transactionPage.check_nftDisplayed('Test Dapp NFTs #1');
        await transactionPage.clickEdit();

        await transactionPage.openAssetPicker();
        await driver.clickElement({ css: 'button', text: 'Tokens' });
        await driver.clickElement(
          '[data-testid="multichain-token-list-button"]',
        );

        await transactionPage.check_transactionAmount('ETH');

        await transactionPage.enterAmount('2');
        await transactionPage.clickContinue();

        await transactionPage.check_transactionAmount('2.000042');
        await transactionPage.clickConfirm();

        await transactionPage.check_transactionStatus('Send');
        await driver.waitForSelector({
          css: '[data-testid="transaction-list-item-primary-currency"]',
          text: '-2 ETH',
        });
      },
    );
  });

  it('changes to native currency when switching accounts during a NFT send', async function () {
    const FixtureBuilder = await getFixtureBuilder();
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
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer: GanacheServer;
      }) => {
        const transactionPage = new TransactionPage(driver);

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

        await driver.clickElement('[data-testid="account-overview__nfts-tab"]');
        await driver.clickElement('[data-testid="nft-default-image"]');
        await driver.clickElement('[data-testid="nft-send-button"]');

        await transactionPage.selectRecipient();
        await transactionPage.check_nftSelected('TDN', '#1');

        // Switch to Account 2
        await driver.clickElement('[data-testid="send-page-account-picker"]');
        await driver.clickElement({
          css: `.multichain-account-list-item .multichain-account-list-item__account-name__button`,
          text: 'Account 2',
        });

        await transactionPage.check_transactionAmount('ETH');

        // Go back to Account 1
        await driver.clickElement('[data-testid="send-page-account-picker"]');
        await driver.clickElement({
          css: `.multichain-account-list-item .multichain-account-list-item__account-name__button`,
          text: 'Account 1',
        });

        await transactionPage.check_transactionAmount('ETH');

        await transactionPage.enterAmount('2');

        // Make sure hex data is cleared after switching assets
        const hexDataLocator = await driver.findElement(
          '[data-testid="send-hex-textarea"]',
        );
        const hexDataValue = await hexDataLocator.getAttribute('value');
        assert.equal(
          hexDataValue,
          '',
          'Hex data has not been cleared after switching assets.',
        );

        // Make sure gas is updated by resetting amount and hex data
        // Note: this is needed until the race condition is fixed on the wallet level (issue #25243)
        await driver.fill('[data-testid="currency-input"]', '2');
        await driver.executeScript(
          'arguments[0].value = "0x";',
          hexDataLocator,
        );
        await driver.executeScript('arguments[0].value = "";', hexDataLocator);

        await transactionPage.clickContinue();
        await transactionPage.check_transactionAmount('2.000042');
      },
    );
  });
});
