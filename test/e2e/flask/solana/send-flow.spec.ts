import { strict as assert } from 'assert';
import { Suite } from 'mocha';

import SendSolanaPage from '../../page-objects/pages/send/solana-send-page';
import ConfirmSolanaTxPage from '../../page-objects/pages/send/solana-confirm-tx-page';
import SolanaTxresultPage from '../../page-objects/pages/send/solana-tx-result-page';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { withSolanaAccountSnap } from './common-solana';

const commonSolanaAddress = 'GYP1hGem9HBkYKEWNUQUxEwfmu4hhjuujRgGnj5LrHna';
describe.skip('Send flow', function (this: Suite) {
  it('with some field validation', async function () {
    this.timeout(120000);
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle(), showNativeTokenAsMainBalance: true },
      async (driver) => {
        await driver.refresh(); // workaround to not get an error due to https://consensyssoftware.atlassian.net/browse/SOL-87
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.clickOnSendButton();
        const sendSolanaPage = new SendSolanaPage(driver);
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
        await sendSolanaPage.setToAddress('');
        assert.equal(
          await sendSolanaPage.check_validationErrorAppears(
            'To address is required',
          ),
          true,
          'To address is required should appear and it does not',
        );
        await sendSolanaPage.setToAddress(commonSolanaAddress);
        await sendSolanaPage.setAmount('0.1');
        assert.equal(
          await sendSolanaPage.check_validationErrorAppears(
            'Insufficient balance',
          ),
          true,
          'Insufficient balance text is not displayed',
        );
        await sendSolanaPage.setAmount('0');
        assert.equal(
          await sendSolanaPage.check_validationErrorAppears(
            'Amount must be greater than 0',
          ),
          true,
          'Amount must be greater than 0 text is not displayed',
        );
      },
    );
  });
});
describe.skip('Send full flow of USD', function (this: Suite) {
  it('with a positive balance account', async function () {
    // skipped due tohttps://consensyssoftware.atlassian.net/browse/SOL-100
    this.timeout(120000);
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockCalls: true,
        mockSendTransaction: true,
      },
      async (driver) => {
        await driver.refresh(); // workaround to not get an error due to https://consensyssoftware.atlassian.net/browse/SOL-87
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_pageIsLoaded();
        assert.equal(
          await homePage.check_ifSendButtonIsClickable(),
          true,
          'Send button is not enabled and it should',
        );
        assert.equal(
          await homePage.check_ifSwapButtonIsClickable(),
          false,
          'Swap button is enabled and it shouldn`t',
        );
        assert.equal(
          await homePage.check_ifBridgeButtonIsClickable(),
          false,
          'Bridge button is enabled  and it should`t',
        );
        await homePage.clickOnSendButton();
        const sendSolanaPage = new SendSolanaPage(driver);
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
        await sendSolanaPage.setAmount('0.1');
        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);
        await sendSolanaPage.clickOnContinue();
        assert.equal(
          await confirmSolanaPage.checkAmountDisplayed('0.1', 'USD'),
          true,
          'Check amount displayed is wrong',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('From'),
          true,
          'From is not displayed and it should',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Amount'),
          true,
          'Amount is not displayed and it should',
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
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Total'),
          true,
          'Total is not displayed and it should',
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
          await sentTxPage.isTransactionDetailDisplayed('Amount'),
          true,
          'Amount field not displayed and it should',
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
          await sentTxPage.isTransactionDetailDisplayed('Total'),
          true,
          'Total field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.check_isViewTransactionLinkDisplayed(),
          true,
          'View transaction link is not displayed and it should',
        );
      },
    );
  });
});
describe.skip('Send full flow of SOL', function (this: Suite) {
  it('with a positive balance account', async function () {
    this.timeout(120000);
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockCalls: true,
        mockSendTransaction: true,
      },
      async (driver) => {
        await driver.refresh(); // workaround to not get an error due to https://consensyssoftware.atlassian.net/browse/SOL-87
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_pageIsLoaded();
        assert.equal(
          await homePage.check_ifSendButtonIsClickable(),
          true,
          'Send button is not enabled and it should',
        );
        assert.equal(
          await homePage.check_ifSwapButtonIsClickable(),
          false,
          'Swap button is enabled and it shouldn`t',
        );
        assert.equal(
          await homePage.check_ifBridgeButtonIsClickable(),
          false,
          'Bridge button is enabled  and it should`t',
        );
        await homePage.clickOnSendButton();
        const sendSolanaPage = new SendSolanaPage(driver);
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
          await confirmSolanaPage.isTransactionDetailDisplayed('Amount'),
          true,
          'Amount is not displayed and it should',
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
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Total'),
          true,
          'Total is not displayed and it should',
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
          await sentTxPage.isTransactionDetailDisplayed('Amount'),
          true,
          'Amount field not displayed and it should',
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
          await sentTxPage.isTransactionDetailDisplayed('Total'),
          true,
          'Total field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.check_isViewTransactionLinkDisplayed(),
          true,
          'View transaction link is not displayed and it should',
        );
      },
    );
  });
});
describe.skip('Send flow flow', function (this: Suite) {
  it('and Transaction fails', async function () {
    this.timeout(120000); // there is a bug open for this big timeout https://consensyssoftware.atlassian.net/browse/SOL-90
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockCalls: true,
        mockSendTransaction: false,
      },
      async (driver) => {
        await driver.refresh(); // workaround to not get an error due to https://consensyssoftware.atlassian.net/browse/SOL-87
        const homePage = new NonEvmHomepage(driver);
        assert.equal(
          await homePage.check_ifSendButtonIsClickable(),
          true,
          'Send button is not enabled and it should',
        );
        assert.equal(
          await homePage.check_ifSwapButtonIsClickable(),
          false,
          'Swap button is enabled and it should`t',
        );
        assert.equal(
          await homePage.check_ifBridgeButtonIsClickable(),
          false,
          'Bridge button is enabled and it should`t',
        );
        await homePage.clickOnSendButton();
        const sendSolanaPage = new SendSolanaPage(driver);
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
          await failedTxPage.isTransactionDetailDisplayed('Amount'),
          true,
          'Amount field not displayed and it should',
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
        assert.equal(
          await failedTxPage.isTransactionDetailDisplayed('Total'),
          true,
          'Total field not displayed and it should',
        );
      },
    );
  });
});
