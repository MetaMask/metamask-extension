import { Suite } from 'mocha';
import { DEFAULT_BTC_BALANCE, DEFAULT_BTC_FEE_RATE } from '../../constants';
import BitcoinSendPage from '../../page-objects/pages/send/bitcoin-send-page';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import BitcoinReviewTxPage from '../../page-objects/pages/send/bitcoin-review-tx-page';
import { withBtcAccountSnap } from './common-btc';

describe('BTC Account - Send', function (this: Suite) {
  const recipientAddress = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';

  it('can complete the send flow', async function () {
    const sendAmount = '0.5';
    const expectedFee = '281';
    const expectedTotal = '0.50000281';

    await withBtcAccountSnap(async (driver) => {
      const homePage = new BitcoinHomepage(driver);
      await homePage.check_pageIsLoaded();
      await homePage.check_isExpectedBitcoinBalanceDisplayed(
        DEFAULT_BTC_BALANCE,
      );
      await homePage.startSendFlow();

      const bitcoinSendPage = new BitcoinSendPage(driver);
      await bitcoinSendPage.check_pageIsLoaded();
      await bitcoinSendPage.fillRecipientAddress(recipientAddress);
      await bitcoinSendPage.fillAmount(sendAmount);
      await bitcoinSendPage.clickReviewButton();

      // ------------------------------------------------------------------------------
      // From here, we have moved to the confirmation screen (second part of the flow).

      const bitcoinReviewTxPage = new BitcoinReviewTxPage(driver);
      await bitcoinReviewTxPage.check_pageIsLoaded();
      await driver.waitForSelector({
        text: `Sending ${sendAmount} BTC`,
        tag: 'h2',
      });
      await driver.waitForSelector({
        text: `${expectedFee} sats`,
        tag: 'p',
      });
      await driver.waitForSelector({
        text: `${Math.floor(DEFAULT_BTC_FEE_RATE)} sat/vB`,
        tag: 'p',
      });
      await driver.waitForSelector({
        text: `${expectedTotal} BTC`,
        tag: 'p',
      });
      await bitcoinReviewTxPage.clickSendButton();

      // TODO: Test that the transaction appears in the activity tab once activity tab is implemented for Bitcoin
      await homePage.check_pageIsLoaded();
    }, this.test?.fullTitle());
  });

  it('can send the max amount', async function () {
    const expectedFee = 0.00000219;

    await withBtcAccountSnap(async (driver) => {
      const homePage = new BitcoinHomepage(driver);
      await homePage.check_pageIsLoaded();
      await homePage.check_isExpectedBitcoinBalanceDisplayed(
        DEFAULT_BTC_BALANCE,
      );
      await homePage.startSendFlow();

      const bitcoinSendPage = new BitcoinSendPage(driver);
      await bitcoinSendPage.check_pageIsLoaded();
      await bitcoinSendPage.fillRecipientAddress(recipientAddress);
      await bitcoinSendPage.selectMaxAmount();
      await bitcoinSendPage.clickReviewButton();

      // ------------------------------------------------------------------------------
      // From here, we have moved to the confirmation screen (second part of the flow).

      const bitcoinReviewTxPage = new BitcoinReviewTxPage(driver);
      await bitcoinReviewTxPage.check_pageIsLoaded();
      await driver.waitForSelector({
        text: `Sending ${DEFAULT_BTC_BALANCE - expectedFee} BTC`,
        tag: 'h2',
      });
      await driver.waitForSelector({
        text: `${DEFAULT_BTC_BALANCE} BTC`,
        tag: 'p',
      });
      await bitcoinReviewTxPage.clickSendButton();

      // TODO: Test that the transaction appears in the activity tab once activity tab is implemented for Bitcoin
      await homePage.check_pageIsLoaded();
    }, this.test?.fullTitle());
  });
});
