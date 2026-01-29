import { Suite } from 'mocha';
import { DEFAULT_BTC_BALANCE } from '../../constants';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import BitcoinReviewTxPage from '../../page-objects/pages/send/bitcoin-review-tx-page';
import SendPage from '../../page-objects/pages/send/send-page';
import { withBtcAccountSnap } from './common-btc';

describe('BTC Account - Send', function (this: Suite) {
  const recipientAddress = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';
  const bitcoinChainId = 'bip122:000000000019d6689c085ae165831e93';
  this.timeout(120000);

  it('fields validation', async function () {
    await withBtcAccountSnap(async (driver) => {
      const homePage = new BitcoinHomepage(driver);
      const sendPage = new SendPage(driver);
      await homePage.checkPageIsLoaded();
      await homePage.checkIsExpectedBitcoinBalanceDisplayed(
        DEFAULT_BTC_BALANCE,
      );
      await homePage.startSendFlow();
      await sendPage.selectToken(bitcoinChainId, 'BTC');

      await sendPage.fillRecipient('invalidBTCAddress');
      await sendPage.checkInvalidAddressError();

      await sendPage.fillAmount('50');
      await sendPage.checkInsufficientFundsError();
    }, this.test?.fullTitle());
  });
  it('can complete the send flow', async function () {
    const sendAmount = '0.5';
    const expectedFee = '0.00000281';
    const expectedTotal = '53381.50';

    await withBtcAccountSnap(async (driver) => {
      const homePage = new BitcoinHomepage(driver);
      const sendPage = new SendPage(driver);
      const activityListPage = new ActivityListPage(driver);

      await homePage.checkPageIsLoaded();
      await homePage.checkIsExpectedBitcoinBalanceDisplayed(
        DEFAULT_BTC_BALANCE,
      );
      await homePage.startSendFlow();

      await sendPage.selectToken(bitcoinChainId, 'BTC');
      await sendPage.fillRecipient(recipientAddress);
      await sendPage.fillAmount(sendAmount);
      await sendPage.isContinueButtonEnabled();
      await sendPage.pressContinueButton();

      // ------------------------------------------------------------------------------
      // From here, we have moved to the confirmation screen (second part of the flow).

      const bitcoinReviewTxPage = new BitcoinReviewTxPage(driver);
      await bitcoinReviewTxPage.checkNetworkFeeIsDisplayed(expectedFee);
      await bitcoinReviewTxPage.checkTotalAmountIsDisplayed(expectedTotal);
      await bitcoinReviewTxPage.clickConfirmButton();

      // TODO: Test that the transaction appears in the activity tab once activity tab is implemented for Bitcoin
      await activityListPage.checkTransactionActivityByText('Sent');
      await activityListPage.checkCompletedTxNumberDisplayedInActivity(1);
      await homePage.checkPageIsLoaded();
    }, this.test?.fullTitle());
  });
});
