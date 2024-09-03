import {
  defaultGanacheOptions,
  withFixtures,
  logInWithBalanceValidation,
} from '../../helpers.js';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { TransactionPage } from '../../page-objects/transaction-page';

// Import FixtureBuilder using CommonJS require
const FixtureBuilder = require('../../fixture-builder');

// Validate FixtureBuilder structure
if (typeof FixtureBuilder !== 'function' || typeof new FixtureBuilder().withNftControllerERC721 !== 'function') {
  throw new Error('Invalid FixtureBuilder structure');
}

describe('Change assets', function () {
  it('sends the correct asset when switching from native currency to NFT', async function () {
    this.timeout(120000); // Increase timeout to 120 seconds
    const smartContract = SMART_CONTRACTS.NFTS;

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC721().build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        const transactionPage = new TransactionPage(driver);

        try {
          await logInWithBalanceValidation(driver, ganacheServer);

          // Wait for balance to load
          await driver.delay(500);

          console.log('Initiating transaction...');
          await transactionPage.clickSendButton();
          await transactionPage.selectRecipient();
          await transactionPage.enterAmount('2');
          await transactionPage.clickContinue();

          console.log('Checking initial transaction amount...');
          await transactionPage.check_transactionAmount('2.000042');
          await transactionPage.clickEdit();

          console.log('Switching to NFT...');
          await transactionPage.openAssetPicker();
          await transactionPage.selectNFTTab();
          await transactionPage.selectNFT();

          console.log('Verifying NFT selection...');
          await transactionPage.check_nftSelected('TDN', '#1');
          await transactionPage.clickContinue();

          console.log('Confirming NFT transaction...');
          await transactionPage.check_nftDisplayed('Test Dapp NFTs #1');
          await transactionPage.clickConfirm();

          console.log('Verifying transaction status...');
          await transactionPage.check_transactionStatus('Send Test Dapp NFTs #1');

          console.log('Test completed successfully.');
        } catch (error) {
          console.error('Test failed:', error);
          throw error;
        }
      }
    );
  });

  // Add more test cases here...
});
