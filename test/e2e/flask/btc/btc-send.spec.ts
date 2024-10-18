import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { DEFAULT_BTC_ACCOUNT } from '../../constants';
import { getQuickNodeSeenRequests, withBtcAccountSnap } from './common-btc';

enum SendFlowPlaceHolders {
  AMOUNT = 'Enter amount to send',
  RECIPIENT = 'Enter receiving address',
  LOADING = 'Preparing transaction',
}

describe('BTC Account - Send', function (this: Suite) {
  it('can send complete the send flow', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver, mockServer) => {
        // Wait a bit so the MultichainRatesController is able to fetch BTC -> USD rates.
        await driver.delay(1000);

        // Start the send flow.
        const sendButton = await driver.waitForSelector({
          text: 'Send',
          tag: 'button',
          css: '[data-testid="coin-overview-send"]',
        });
        await sendButton.click();

        // See the review button is disabled by default.
        await driver.waitForSelector({
          text: 'Review',
          tag: 'button',
          css: '[disabled]',
        });

        // Set the recipient address (ourself in this case).
        await driver.fill(
          `[placeholder="${SendFlowPlaceHolders.RECIPIENT}"]`,
          DEFAULT_BTC_ACCOUNT,
        );

        // Set the amount to send.
        const mockAmountToSend = '0.5';
        await driver.fill(
          `[placeholder="${SendFlowPlaceHolders.AMOUNT}"]`,
          mockAmountToSend,
        );

        // Wait for for the "summary panel" to start loading.
        await driver.waitForSelector({
          text: SendFlowPlaceHolders.LOADING,
        });

        // Wait for the loading to disappear.
        await driver.assertElementNotPresent({
          text: SendFlowPlaceHolders.LOADING,
        });

        // From here, the "summary panel" should have some information about the fees and total.
        await driver.waitForSelector({
          text: 'Total',
          tag: 'p',
        });

        // The review button will become available.
        const snapReviewButton = await driver.findClickableElement({
          text: 'Review',
          tag: 'button',
          css: '.snap-ui-renderer__footer-button',
        });
        assert.equal(await snapReviewButton.isEnabled(), true);
        await snapReviewButton.click();

        // TODO: There isn't any check for the fees and total amount. This requires calculating the vbytes used in a transaction dynamically.
        // We already have unit tests for these calculations on the snap.

        // ------------------------------------------------------------------------------
        // From here, we have moved to the confirmation screen (second part of the flow).

        // We should be able to send the transaction right away.
        const snapSendButton = await driver.waitForSelector({
          text: 'Send',
          tag: 'button',
          css: '.snap-ui-renderer__footer-button',
        });
        assert.equal(await snapSendButton.isEnabled(), true);
        await snapSendButton.click();

        // Check that we are selecting the "Activity tab" right after the send.
        await driver.waitForSelector({
          tag: 'div',
          text: 'Bitcoin activity is not supported',
        });

        // NOTE: We wait to land on the "Activity tab" first before checking the transaction network call!
        // Check that the transaction has been sent.
        const transactionRequest = (
          await getQuickNodeSeenRequests(mockServer)
        ).find(async (request) => {
          const body = (await request.body.getJson()) as { method: string };
          return body.method === 'sendrawtransaction';
        });
        // TODO: check for the response as well.
        assert(transactionRequest !== undefined);
      },
    );
  });
});
