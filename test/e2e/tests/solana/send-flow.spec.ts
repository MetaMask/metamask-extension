import { strict as assert } from 'assert';
import { Suite } from 'mocha';

import SendSolanaPage from '../../page-objects/pages/send/solana-send-page';
import ConfirmSolanaTxPage from '../../page-objects/pages/send/solana-confirm-tx-page';
import SolanaTxresultPage from '../../page-objects/pages/send/solana-tx-result-page';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { withSolanaAccountSnap } from './common-solana';

const commonSolanaAddress = 'GYP1hGem9HBkYKEWNUQUxEwfmu4hhjuujRgGnj5LrHna';
// Investigate why this test is flaky https://consensyssoftware.atlassian.net/browse/MMQA-549
// eslint-disable-next-line mocha/no-skipped-tests
describe('Send flow', function (this: Suite) {
  it('with some field validation', async function () {
    this.timeout(120000);
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockZeroBalance: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_pageIsLoaded('0');
        await homePage.clickOnSendButton();
        const sendSolanaPage = new SendSolanaPage(driver);
        await sendSolanaPage.check_pageIsLoaded();
        assert.equal(
          await sendSolanaPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled and it shouldn`t',
        );
        await sendSolanaPage.setToAddress('2433asd');
        assert.equal(
          await sendSolanaPage.check_validationErrorAppears(
            'Invalid Solana address',
          ),
          true,
          'Invalid Solana address should appear and it does not',
        );
        await sendSolanaPage.clearToAddress();
        await sendSolanaPage.setToAddress(commonSolanaAddress);
        await sendSolanaPage.setAmount('1');
        assert.equal(
          await sendSolanaPage.check_validationErrorAppears(
            'Insufficient balance',
          ),
          true,
          'Insufficient balance text is not displayed',
        );
        await sendSolanaPage.clearToAddress();
        assert.equal(
          await sendSolanaPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled and it shouldn`t',
        );
        assert.equal(
          await sendSolanaPage.isAmountInputDisplayed(),
          false,
          'Amount input should appear and it does not',
        );
      },
    );
  });

  it('full flow of USD with a positive balance account', async function () {
    this.timeout(120000);
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockGetTransactionSuccess: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_pageIsLoaded('50');
        assert.equal(
          await homePage.check_ifSendButtonIsClickable(),
          true,
          'Send button is not enabled and it should',
        );
        assert.equal(
          await homePage.check_ifSwapButtonIsClickable(),
          true,
          'Swap button is not enabled and it should',
        );
        assert.equal(
          await homePage.check_ifBridgeButtonIsClickable(),
          true,
          'Bridge button is not enabled and it should',
        );
        await homePage.clickOnSendButton();
        const sendSolanaPage = new SendSolanaPage(driver);
        await sendSolanaPage.check_pageIsLoaded();
        assert.equal(
          await sendSolanaPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address nor amount',
        );
        await sendSolanaPage.setToAddress(commonSolanaAddress);
        assert.equal(
          await sendSolanaPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address',
        );
        await sendSolanaPage.clickOnSwapCurrencyButton();
        assert.equal(
          await sendSolanaPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address nor amount',
        );

        await sendSolanaPage.setAmount('10');

        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);
        await sendSolanaPage.clickOnContinue();
        assert.equal(
          await confirmSolanaPage.checkAmountDisplayed('0.0886'),
          true,
          'Check amount displayed is wrong',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('From'),
          true,
          'From is not displayed and it should',
        );

        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Recipient'),
          true,
          'Recipient is not displayed and it should',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Network'),
          true,
          'Network is not displayed and it should',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed(
            'Transaction speed',
          ),
          true,
          'Transaction speed is not displayed and it should',
        );

        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Network fee'),
          true,
          'Network fee is not displayed and it should',
        );

        await confirmSolanaPage.clickOnSend();
        const sentTxPage = new SolanaTxresultPage(driver);
        assert.equal(
          await sentTxPage.check_TransactionStatusText('0.0886', true),
          true,
          'Transaction amount is not correct',
        );
        assert.equal(
          await sentTxPage.check_TransactionStatus(true),
          true,
          'Transaction was not sent as expected',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('From'),
          true,
          'From field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Recipient'),
          true,
          'Recipient field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Network'),
          true,
          'Network field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Transaction speed'),
          true,
          'Transaction field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Network fee'),
          true,
          'Network fee field not displayed',
        );
        assert.equal(
          await sentTxPage.check_isViewTransactionLinkDisplayed(),
          true,
          'View transaction link is not displayed and it should',
        );
      },
    );
  });

  it('full flow of SOL with a positive balance account', async function () {
    this.timeout(120000);
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockGetTransactionSuccess: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_pageIsLoaded('50');
        assert.equal(
          await homePage.check_ifSendButtonIsClickable(),
          true,
          'Send button is not enabled and it should',
        );
        assert.equal(
          await homePage.check_ifSwapButtonIsClickable(),
          true,
          'Swap button is not enabled and it should',
        );
        assert.equal(
          await homePage.check_ifBridgeButtonIsClickable(),
          true,
          'Bridge button is not enabled and it should',
        );
        await homePage.clickOnSendButton();
        const sendSolanaPage = new SendSolanaPage(driver);
        await sendSolanaPage.check_pageIsLoaded('50 SOL');
        assert.equal(
          await sendSolanaPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address nor amount',
        );
        await sendSolanaPage.setToAddress(commonSolanaAddress);
        assert.equal(
          await sendSolanaPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address',
        );
        await sendSolanaPage.setAmount('0.1');
        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);
        await sendSolanaPage.clickOnContinue();
        assert.equal(
          await confirmSolanaPage.checkAmountDisplayed('0.1'),
          true,
          'Check amount displayed is wrong',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('From'),
          true,
          'From is not displayed and it should',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Recipient'),
          true,
          'Recipient is not displayed and it should',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Network'),
          true,
          'Network is not displayed and it should',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed(
            'Transaction speed',
          ),
          true,
          'Transaction speed is not displayed and it should',
        );

        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Network fee'),
          true,
          'Network fee is not displayed and it should',
        );
        await confirmSolanaPage.clickOnSend();
        const sentTxPage = new SolanaTxresultPage(driver);
        assert.equal(
          await sentTxPage.check_TransactionStatusText('0.1', true),
          true,
          'Transaction amount is not correct',
        );
        assert.equal(
          await sentTxPage.check_TransactionStatus(true),
          true,
          'Transaction was not sent as expected',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('From'),
          true,
          'From field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Recipient'),
          true,
          'Recipient field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Network'),
          true,
          'Network field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Transaction speed'),
          true,
          'Transaction field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Network fee'),
          true,
          'Network fee field not displayed',
        );
        assert.equal(
          await sentTxPage.check_isViewTransactionLinkDisplayed(),
          true,
          'View transaction link is not displayed and it should',
        );
      },
    );
  });

  it('and transaction fails', async function () {
    this.timeout(120000);
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockGetTransactionFailed: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_getBalance('50', 'SOL');
        await homePage.clickOnSendButton();

        const sendSolanaPage = new SendSolanaPage(driver);
        await sendSolanaPage.check_pageIsLoaded('50 SOL');
        await sendSolanaPage.setToAddress(commonSolanaAddress);
        await sendSolanaPage.setAmount('0.1');
        // assert.equal(await sendSolanaPage.isContinueButtonEnabled(), true, "Continue button is not enabled when address and amount are set");
        await sendSolanaPage.clickOnContinue();
        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);

        await confirmSolanaPage.clickOnSend();
        const failedTxPage = new SolanaTxresultPage(driver);
        assert.equal(
          await failedTxPage.check_TransactionStatusText('0.1', false),
          true,
          'Transaction amount is not correct',
        );
        assert.equal(
          await failedTxPage.check_TransactionStatus(false),
          true,
          'Transaction did not fail as expected',
        );
        assert.equal(
          await failedTxPage.isTransactionDetailDisplayed('From'),
          true,
          'From field not displayed and it should',
        );
        assert.equal(
          await failedTxPage.isTransactionDetailDisplayed('Recipient'),
          true,
          'Recipient field not displayed and it should',
        );
        assert.equal(
          await failedTxPage.isTransactionDetailDisplayed('Network'),
          true,
          'Network field not displayed and it should',
        );
        assert.equal(
          await failedTxPage.isTransactionDetailDisplayed('Transaction speed'),
          true,
          'Transaction field not displayed and it should',
        );
        assert.equal(
          await failedTxPage.isTransactionDetailDisplayed('Network fee'),
          true,
          'Network fee field not displayed and it should',
        );
      },
    );
  });
});
