import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { DEFAULT_BTC_ACCOUNT, DEFAULT_BTC_BALANCE } from '../../constants';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import BitcoinSendPage from '../../page-objects/pages/send/bitcoin-send-page';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import BitcoinReviewTxPage from '../../page-objects/pages/send/bitcoin-review-tx-page';
import { getTransactionRequest, withBtcAccountSnap } from './common-btc';

describe('BTC Account - Send', function (this: Suite) {
  it('can complete the send flow', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver, mockServer) => {
        const homePage = new BitcoinHomepage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_isExpectedBitcoinBalanceDisplayed(
          DEFAULT_BTC_BALANCE,
        );
        await homePage.startSendFlow();

        // Set the recipient address and amount
        const bitcoinSendPage = new BitcoinSendPage(driver);
        await bitcoinSendPage.check_pageIsLoaded();
        await bitcoinSendPage.fillRecipientAddress(DEFAULT_BTC_ACCOUNT);
        // TODO: Remove delay here. There is a race condition if the amount and address are set too fast.
        await driver.delay(1000);
        const mockAmountToSend = '0.5';
        await bitcoinSendPage.fillAmount(mockAmountToSend);

        // Click the review button
        await bitcoinSendPage.clickReviewButton();

        // TODO: There isn't any check for the fees and total amount. This requires calculating the vbytes used in a transaction dynamically.
        // We already have unit tests for these calculations on the Snap.
        // ------------------------------------------------------------------------------
        // From here, we have moved to the confirmation screen (second part of the flow).

        // Click the send transaction button
        const bitcoinReviewTxPage = new BitcoinReviewTxPage(driver);
        await bitcoinReviewTxPage.check_pageIsLoaded();
        await bitcoinReviewTxPage.clickSendButton();

        // Check that we are on the activity list page and the warning message is displayed
        await homePage.check_pageIsLoaded();
        await new ActivityListPage(driver).check_warningMessage(
          'Bitcoin activity is not supported',
        );
        const transaction = await getTransactionRequest(mockServer);
        assert(transaction !== undefined);
      },
    );
  });

  it('can send the max amount', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver, mockServer) => {
        const homePage = new BitcoinHomepage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_isExpectedBitcoinBalanceDisplayed(
          DEFAULT_BTC_BALANCE,
        );
        await homePage.startSendFlow();

        // Use the max spendable amount of that account
        const bitcoinSendPage = new BitcoinSendPage(driver);
        await bitcoinSendPage.check_pageIsLoaded();
        await bitcoinSendPage.fillRecipientAddress(DEFAULT_BTC_ACCOUNT);
        // TODO: Remove delay here. There is a race condition if the amount and address are set too fast.
        await driver.delay(1000);
        await bitcoinSendPage.selectMaxAmount();
        await bitcoinSendPage.check_amountIsDisplayed(
          `${DEFAULT_BTC_BALANCE} BTC`,
        );

        // From here, the "summary panel" should have some information about the fees and total.
        await bitcoinSendPage.clickReviewButton();

        // TODO: There isn't any check for the fees and total amount. This requires calculating the vbytes used in a transaction dynamically.
        // We already have unit tests for these calculations on the snap.

        // ------------------------------------------------------------------------------
        // From here, we have moved to the confirmation screen (second part of the flow).

        // Click the send transaction button
        const bitcoinReviewTxPage = new BitcoinReviewTxPage(driver);
        await bitcoinReviewTxPage.check_pageIsLoaded();
        await bitcoinReviewTxPage.clickSendButton();

        // Check that we are on the activity list page and the warning message is displayed
        await homePage.check_pageIsLoaded();
        await new ActivityListPage(driver).check_warningMessage(
          'Bitcoin activity is not supported',
        );
        const transaction = await getTransactionRequest(mockServer);
        assert(transaction !== undefined);
      },
    );
  });
});
