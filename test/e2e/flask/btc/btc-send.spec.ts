import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { DEFAULT_BTC_ACCOUNT } from '../../constants';
import { QUICKNODE_URL_REGEX, withBtcAccountSnap } from './common-btc';

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
        await driver.delay(1000);

        const sendButton = await driver.waitForSelector({
          text: 'Send',
          tag: 'button',
          css: '[data-testid="coin-overview-send"]',
        });

        await sendButton.click();

        // see the review button is disabled by default
        await driver.waitForSelector({
          text: 'Review',
          tag: 'button',
          css: '[disabled]',
        });

        // See that the balance is displayed
        await driver.fill(
          `[placeholder="${SendFlowPlaceHolders.RECIPIENT}"]`,
          DEFAULT_BTC_ACCOUNT,
        );

        const mockAmountToSend = '0.5';
        await driver.fill(
          `[placeholder="${SendFlowPlaceHolders.AMOUNT}"]`,
          mockAmountToSend,
        );

        await driver.waitForSelector({
          text: SendFlowPlaceHolders.LOADING,
        });

        // Wait for the loading to disappear
        await driver.assertElementNotPresent({
          text: SendFlowPlaceHolders.LOADING,
        });

        const snapReviewButton = await driver.findClickableElement({
          text: 'Review',
          tag: 'button',
          css: '.snap-ui-renderer__footer-button',
        });

        await snapReviewButton.click();

        // TODO: There isn't any check for the fees and total amount. This requires calculating the vbytes used in a transaction dynamically.
        // We already have unit tests for these calculations on the snap.

        const snapSendButton = await driver.waitForSelector({
          text: 'Send',
          tag: 'button',
          css: '.snap-ui-renderer__footer-button',
        });
        assert.equal(await snapSendButton.isEnabled(), true);
        await snapSendButton.click();

        await driver.waitForSelector({
          tag: 'div',
          text: 'Bitcoin activity is not supported',
        });

        const seenRequests = await Promise.all(
          (
            await mockServer.getMockedEndpoints()
          ).map((mockedEndpoint) => mockedEndpoint.getSeenRequests()),
        );
        const pendingBodies = (await Promise.all(
          seenRequests
            .flat()
            .filter((request) => request.url.match(QUICKNODE_URL_REGEX))
            .map((request) => request.body.getJson()),
        )) as { method: string }[];

        // TODO: check for the response as well.
        const transactionRequest = pendingBodies.find(
          (request) => request.method === 'sendrawtransaction',
        );

        assert(transactionRequest !== undefined);
      },
    );
  });
});
