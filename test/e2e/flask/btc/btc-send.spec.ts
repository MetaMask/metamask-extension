import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { DEFAULT_BTC_ACCOUNT, DEFAULT_BTC_BALANCE } from '../../constants';
import {
  getTransactionRequest,
  SendFlowPlaceHolders,
  startSendFlow,
  withBtcAccountSnap,
} from './common-btc';

describe('BTC Account - Send', function (this: Suite) {
  it('can send complete the send flow', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver, mockServer) => {
        await startSendFlow(driver, DEFAULT_BTC_ACCOUNT);

        await driver.delay(500);

        // Set the amount to send.
        const mockAmountToSend = '0.5';
        await driver.pasteIntoField(
          `input[placeholder="${SendFlowPlaceHolders.AMOUNT}"]`,
          mockAmountToSend,
        );

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
        // We already have unit tests for these calculations on the Snap.

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

        const transaction = await getTransactionRequest(mockServer);
        assert(transaction !== undefined);
      },
    );
  });

  it('can send the max amount', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver, mockServer) => {
        await startSendFlow(driver, DEFAULT_BTC_ACCOUNT);

        // Wait a bit for the inputs to be properly filled on the Snap UI before
        // hitting the "Max" button.
        await driver.delay(500);

        // Use the max spendable amount of that account.
        await driver.clickElement({
          text: 'Max',
          tag: 'button',
        });

        // From here, the "summary panel" should have some information about the fees and total.
        await driver.waitForSelector({
          text: 'Total',
          tag: 'p',
        });

        await driver.waitForSelector({
          text: `${DEFAULT_BTC_BALANCE} BTC`,
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

        const transaction = await getTransactionRequest(mockServer);
        assert(transaction !== undefined);
      },
    );
  });
});
