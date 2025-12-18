import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { getEventPayloads, unlockWallet, withFixtures } from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from './constants';
import { bridgeTransaction, getBridgeFixtures } from './bridge-test-utils';

describe('Swap tests', function (this: Suite) {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout
  it('updates recommended swap quote incrementally when SSE events are received', async function () {
    await withFixtures(
      {
        ...getBridgeFixtures(
          this.test?.fullTitle(),
          BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
          false,
          true,
        ),
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.goToTokensTab();
        await homePage.goToActivityList();

        await bridgeTransaction({
          driver,
          quote: {
            amount: '1',
          },
          expectedTransactionsCount: 1,
          expectedSwapTokens: {
            tokenFrom: 'ETH',
            tokenTo: 'MUSD',
          },
          submitDelay: 10000,
          expectedDestAmount: '3,839',
        });

        const events = (await getEventPayloads(driver, mockedEndpoints)).filter(
          (e) => e?.event?.includes('Unified SwapBridge'),
        );
        const requestedToCompletedEvents = events.slice(6);
        const expectedEvents = [
          'Unified SwapBridge Quotes Requested',
          'Unified SwapBridge Quotes Received',
          'Unified SwapBridge Submitted',
          'Unified SwapBridge Completed',
        ];
        requestedToCompletedEvents.forEach((e, idx) => {
          assert.ok(
            e.event === expectedEvents[idx],
            `${e.event} event validation failed`,
          );
        });

        const quotesReceivedEvent = requestedToCompletedEvents[1];
        assert.ok(
          quotesReceivedEvent.properties.quotes_count === 4,
          `Quote count validation failed. Actual value: ${quotesReceivedEvent.properties.quotes_count}`,
        );
        assert.ok(
          quotesReceivedEvent.properties.provider === '1inch_1inch',
          `Quoted gas validation failed. Actual value: ${quotesReceivedEvent.properties.provider}`,
        );
        // assert.ok(
        //   quotesReceivedEvent.properties.usd_quoted_gas === 34.95660437600472,
        //   `Quoted gas validation failed. Actual value: ${quotesReceivedEvent.properties.usd_quoted_gas}`,
        // );
      },
    );
  });

  it('submits trade before streaming is finished', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
        false,
        true,
      ),
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.goToTokensTab();
        await homePage.goToActivityList();

        await bridgeTransaction({
          driver,
          quote: {
            amount: '1',
          },
          expectedTransactionsCount: 1,
          expectedSwapTokens: {
            tokenFrom: 'ETH',
            tokenTo: 'MUSD',
          },
          expectedDestAmount: '3.011',
        });

        const events = (await getEventPayloads(driver, mockedEndpoints)).filter(
          (e) => e?.event?.includes('Unified SwapBridge'),
        );
        const requestedToCompletedEvents = events.slice(6);

        const expectedEvents = [
          'Unified SwapBridge Quotes Requested',
          'Unified SwapBridge Quotes Received',
          'Unified SwapBridge Submitted',
          'Unified SwapBridge Completed',
        ];
        requestedToCompletedEvents.forEach((e, idx) => {
          assert.ok(
            e.event === expectedEvents[idx],
            `${e.event} event validation failed`,
          );
        });

        const quotesReceivedEvent = requestedToCompletedEvents[1];

        assert.ok(
          quotesReceivedEvent.properties.quotes_count === 2,
          `Quote count validation failed. Actual value: ${quotesReceivedEvent.properties.quotes_count}`,
        );
        assert.ok(
          quotesReceivedEvent.properties.provider === 'openocean_openocean',
          `Quoted gas validation failed. Actual value: ${quotesReceivedEvent.properties.provider}`,
        );
        // assert.ok(
        //   quotesReceivedEvent.properties.usd_quoted_gas === 23.15898006845514,
        //   `Quoted gas validation failed. Actual value: ${quotesReceivedEvent.properties.usd_quoted_gas}`,
        // );
      },
    );
  });
});
