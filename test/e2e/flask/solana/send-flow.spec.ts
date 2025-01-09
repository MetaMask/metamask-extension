import { strict as assert } from 'assert';
import { Suite } from 'mocha';

import SendSolanaPage from '../../page-objects/pages/send/solana-send-page';
import ConfirmSolanaTxPage from '../../page-objects/pages/send/solana-confirm-tx-page';
import SolanaTxresultPage from '../../page-objects/pages/send/solana-tx-result-page';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { getSolanaSeenRequests, withSolanaAccountSnap } from './common-solana';

describe('Send SOL flow', function (this: Suite) {
  it('with a zero balance account', async function () {
    this.timeout(120000);
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle(), showNativeTokenAsMainBalance: true },
      async (driver) => {
        await driver.refresh();
        const homePage = new NonEvmHomepage(driver);
        assert.equal(await homePage.check_ifSendButtonIsClickable(), true);
        assert.equal(await homePage.check_ifSwapButtonIsClickable(), false);
        assert.equal(await homePage.check_ifBridgeButtonIsClickable(), false);
        await homePage.clickOnSend();
        const sendSolanaPage = new SendSolanaPage(driver);
        assert.equal(await sendSolanaPage.isContinueButtonEnabled(), false);
        await sendSolanaPage.setToAddress(
          'GYP1hGem9HBkYKEWNUQUxEwfmu4hhjuujRgGnj5LrHna',
        );
        assert.equal(await sendSolanaPage.isContinueButtonEnabled(), false);
        await sendSolanaPage.setAmount('0.1');
        assert.equal(
          await sendSolanaPage.isInsufficientBalanceDisplayed(),
          true,
          'Insufficiente balance text is not displayed',
        );
      },
    );
  });
  it('with a positive balance account', async function () {
    this.timeout(120000);
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockCalls: true,
        mockSendTransaction: true,
      },
      async (driver, mockServer) => {
        await driver.refresh();
        const homePage = new NonEvmHomepage(driver);
        assert.equal(
          await homePage.check_ifSendButtonIsClickable(),
          true,
          'Send button is not enabled',
        );
        assert.equal(
          await homePage.check_ifSwapButtonIsClickable(),
          false,
          'Swap button is enabled',
        );
        assert.equal(
          await homePage.check_ifBridgeButtonIsClickable(),
          false,
          'Bridge button is enabled',
        );
        await homePage.clickOnSend();
        const sendSolanaPage = new SendSolanaPage(driver);
        assert.equal(
          await sendSolanaPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address nor amount',
        );
        await sendSolanaPage.setToAddress(
          'GYP1hGem9HBkYKEWNUQUxEwfmu4hhjuujRgGnj5LrHna',
        );
        assert.equal(
          await sendSolanaPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address',
        );
        await sendSolanaPage.setAmount('0.1');
        assert.equal(
          await sendSolanaPage.isInsufficientBalanceDisplayed(),
          false,
          'Insufficiente balance text is displayed',
        );
        // assert.equal(await sendSolanaPage.isContinueButtonEnabled(), true, "Continue button is not enabled when address and amount are set");
        await sendSolanaPage.clickOnContinue();
        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);
        assert.equal(
          await confirmSolanaPage.checkAmountDisplayed('0.1'),
          true,
          'Check amount displayed is wrong',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('From'),
          true,
          'From is not displayed',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Amount'),
          true,
          'Amount is not displayed',
        );

        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Recipient'),
          true,
          'Recipient is not displayed',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Network'),
          true,
          'Network is not displayed',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed(
            'Transaction speed',
          ),
          true,
          'Transaction speed is not displayed',
        );

        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Network fee'),
          true,
          'Network fee is not displayed',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Total'),
          true,
          'Total is not displayed',
        );
        await confirmSolanaPage.clickOnSend();
        const sentTxPage = new SolanaTxresultPage(driver);
        assert(transaction !== undefined);
        assert.equal(
          await sentTxPage.checkTransactionStatusText('0.1', true),
          true,
          'Transaction amount is not correct',
        );
        assert.equal(
          await sentTxPage.checkTransactionStatus(true),
          true,
          'Transaction was not sent as expected',
        );
        assert.equal(
          await sentTxPage.isTrancsactionDetailDisplayed('From'),
          true,
          'From field not displayed',
        );
        assert.equal(
          await sentTxPage.isTrancsactionDetailDisplayed('Amount'),
          true,
          'Amount field not displayed',
        );
        assert.equal(
          await sentTxPage.isTrancsactionDetailDisplayed('Recipient'),
          true,
          'Recipient field not displayed',
        );
        assert.equal(
          await sentTxPage.isTrancsactionDetailDisplayed('Network'),
          true,
          'Network field not displayed',
        );
        assert.equal(
          await sentTxPage.isTrancsactionDetailDisplayed('Transaction speed'),
          true,
          'Transaction field not displayed',
        );
        assert.equal(
          await sentTxPage.isTrancsactionDetailDisplayed('Network fee'),
          true,
          'Network fee field not displayed',
        );
        assert.equal(
          await sentTxPage.isTrancsactionDetailDisplayed('Total'),
          true,
          'Total field not displayed',
        );
        assert.equal(
          await sentTxPage.isViewTransactionLinkDisplayed(),
          true,
          'View transaction link is not displayed',
        );
      },
    );
  });
  it('and Transaction fails', async function () {
    this.timeout(120000); // there is a bug open for this big timeout https://consensyssoftware.atlassian.net/browse/SOL-90
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockCalls: true,
      },
      async (driver) => {
        await driver.refresh();
        const homePage = new NonEvmHomepage(driver);
        assert.equal(
          await homePage.check_ifSendButtonIsClickable(),
          true,
          'Send button is not enabled',
        );
        assert.equal(
          await homePage.check_ifSwapButtonIsClickable(),
          false,
          'Swap button is enabled',
        );
        assert.equal(
          await homePage.check_ifBridgeButtonIsClickable(),
          false,
          'Bridge button is enabled',
        );
        await homePage.clickOnSend();
        const sendSolanaPage = new SendSolanaPage(driver);
        await sendSolanaPage.setToAddress(
          'GYP1hGem9HBkYKEWNUQUxEwfmu4hhjuujRgGnj5LrHna',
        );
        await sendSolanaPage.setAmount('0.1');
        // assert.equal(await sendSolanaPage.isContinueButtonEnabled(), true, "Continue button is not enabled when address and amount are set");
        await sendSolanaPage.clickOnContinue();
        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);

        await confirmSolanaPage.clickOnSend();
        const failedTxPage = new SolanaTxresultPage(driver);
        assert.equal(
          await failedTxPage.checkTransactionStatusText('0.1', false),
          true,
          'Transaction amount is not correct',
        );
        assert.equal(
          await failedTxPage.checkTransactionStatus(false),
          true,
          'Transaction did not fail as expected',
        );
        assert.equal(
          await failedTxPage.isTrancsactionDetailDisplayed('From'),
          true,
          'From field not displayed',
        );
        assert.equal(
          await failedTxPage.isTrancsactionDetailDisplayed('Amount'),
          true,
          'Amount field not displayed',
        );
        assert.equal(
          await failedTxPage.isTrancsactionDetailDisplayed('Recipient'),
          true,
          'Recipient field not displayed',
        );
        assert.equal(
          await failedTxPage.isTrancsactionDetailDisplayed('Network'),
          true,
          'Network field not displayed',
        );
        assert.equal(
          await failedTxPage.isTrancsactionDetailDisplayed('Transaction speed'),
          true,
          'Transaction field not displayed',
        );
        assert.equal(
          await failedTxPage.isTrancsactionDetailDisplayed('Network fee'),
          true,
          'Network fee field not displayed',
        );
        assert.equal(
          await failedTxPage.isTrancsactionDetailDisplayed('Total'),
          true,
          'Total field not displayed',
        );
      },
    );
  });
});
