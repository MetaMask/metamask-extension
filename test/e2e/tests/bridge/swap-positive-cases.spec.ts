/* eslint-disable @typescript-eslint/naming-convention */
import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { TokenFeatureType } from '@metamask/bridge-controller';
import { getEventPayloads, withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from './constants';
import {
  bridgeTransaction,
  getBridgeFixtures,
  verifySubmittedSwapTransaction,
} from './bridge-test-utils';

describe('Swap tests', function (this: Suite) {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout
  it('updates recommended swap quote incrementally when SSE events are received', async function () {
    await withFixtures(
      {
        ...getBridgeFixtures(
          this.test?.fullTitle(),
          { ...BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED, refreshRate: 30000 },
          false,
          true,
        ),
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await login(driver, { expectedBalance: '$225,730.11' });

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

        const events = await getEventPayloads(driver, mockedEndpoints);
        const unifiedSwapBridgeEvents = events.filter((e) =>
          e?.event?.includes('Unified SwapBridge'),
        );
        const transactionFinalizedEvents = events.filter(
          (e) => e?.event === 'Transaction Finalized',
        );

        const requestedToCompletedEvents = unifiedSwapBridgeEvents.slice(6);
        const expectedEvents = [
          'Unified SwapBridge Quotes Requested',
          'Unified SwapBridge Quotes Received',
          'Unified SwapBridge Submitted',
          'Unified SwapBridge Completed',
        ];
        requestedToCompletedEvents.forEach((e, idx) => {
          assert.ok(
            e.event === expectedEvents[idx],
            `${e.event} event validation failed at index ${idx}`,
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

        assert.ok(
          transactionFinalizedEvents.length === 1,
          `Transaction Finalized event validation failed. Actual value: ${transactionFinalizedEvents.length}`,
        );
        assert.ok(
          transactionFinalizedEvents[0].properties.transaction_hash !==
            undefined,
          `Transaction Finalized transaction_hash validation failed. Actual value: ${transactionFinalizedEvents[0].properties.transaction_hash}`,
        );
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
        await login(driver, { expectedBalance: '$225,730.11' });

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

  it('submits swap with token alert', async function () {
    await withFixtures(
      {
        ...getBridgeFixtures(
          this.test?.fullTitle(),
          { ...BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED, refreshRate: 30000 },
          false,
          true,
          true,
          [
            {
              type: TokenFeatureType.MALICIOUS,
              feature_id: 'HONEYPOT',
              description: 'Token alert 1',
            },
          ],
        ),
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();

        console.log('Requesting swap quote');
        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.enterBridgeQuote({
          amount: '1',
        });
        await bridgePage.waitForQuote();

        await bridgePage.submitQuoteWithWarning(1);
        await bridgePage.rejectModal();
        console.log('Rejected token alert modal');

        await bridgePage.submitQuoteWithWarning();
        await bridgePage.approveModal();
        console.log('Approved token alert modal and submitted swap');

        await verifySubmittedSwapTransaction({
          driver,
          quote: {
            amount: '1',
          },
          expectedTransactionsCount: 1,
          expectedStatus: 'success',
          expectedSwapTokens: {
            tokenFrom: 'ETH',
            tokenTo: 'MUSD',
          },
        });
      },
    );
  });

  it('submits swap with price impact error and multiple token alerts', async function () {
    await withFixtures(
      {
        ...getBridgeFixtures(
          this.test?.fullTitle(),
          {
            ...BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
            refreshRate: 30000,
            priceImpactThreshold: {
              ...BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED.priceImpactThreshold,
              gasless: 0.01,
              normal: 0.01,
              warning: 0.25,
              error: 0.0001,
            },
          },
          false,
          true,
          true,
          [
            {
              type: TokenFeatureType.MALICIOUS,
              feature_id: 'HONEYPOT',
              description: 'Token alert 1',
            },
            {
              type: TokenFeatureType.WARNING,
              feature_id: 'AIRDROP_PATTERN',
              description: 'Token alert 2',
            },
            {
              type: TokenFeatureType.MALICIOUS,
              feature_id: 'UNKNOWN_TOKEN_ALERT',
              description: 'Token alert 3',
            },
            {
              type: TokenFeatureType.INFO,
              feature_id: 'CONCENTRATED_SUPPLY_DISTRIBUTION',
              description: 'Token alert 4',
            },
          ],
        ),
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();

        const bridgePage = new BridgeQuotePage(driver);

        console.log('Requesting swap quote');
        await bridgePage.enterBridgeQuote({
          amount: '1',
        });
        await bridgePage.waitForQuote();
        await bridgePage.checkPriceImpactModalIsDisplayed();

        await bridgePage.submitQuoteWithWarning(3);
        await bridgePage.rejectModal();
        console.log('Rejected first token alert modal');

        await bridgePage.submitQuoteWithWarning();
        await bridgePage.approveModal();
        await bridgePage.rejectModal();
        console.log('Rejected second token alert modal');

        await bridgePage.submitQuoteWithWarning();
        await bridgePage.approveModal();
        await bridgePage.approveModal();
        await bridgePage.approveModal();
        await bridgePage.rejectModal();
        console.log('Rejected price impact modal');

        await bridgePage.dismissTokenAlert();
        console.log('Dismissed token alert modal');

        await bridgePage.submitQuoteWithWarning(2);
        console.log('Verified that 2 token alerts are still displayed');
        await bridgePage.approveModal();
        await bridgePage.approveModal();
        await bridgePage.approveModal();
        console.log('Approved token alert modals');
        await bridgePage.approveModal();
        console.log('Approved price impact modal and submitted swap');

        await verifySubmittedSwapTransaction({
          driver,
          quote: {
            amount: '1',
          },
          expectedTransactionsCount: 1,
          expectedStatus: 'success',
          expectedSwapTokens: {
            tokenFrom: 'ETH',
            tokenTo: 'MUSD',
          },
        });
      },
    );
  });

  it('submits swap with price impact error', async function () {
    await withFixtures(
      {
        ...getBridgeFixtures(
          this.test?.fullTitle(),
          {
            ...BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
            refreshRate: 30000,
            priceImpactThreshold: {
              ...BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED.priceImpactThreshold,
              gasless: 0.01,
              normal: 0.01,
              warning: 0.25,
              error: 0.0001,
            },
          },
          false,
          true,
        ),
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();

        const bridgePage = new BridgeQuotePage(driver);

        console.log('Requesting swap quote');
        await bridgePage.enterBridgeQuote({
          amount: '1',
        });
        await bridgePage.waitForQuote();

        await bridgePage.submitQuoteWithWarning();
        await bridgePage.rejectModal();
        console.log('Rejected price impact modal');

        await bridgePage.submitQuoteWithWarning();
        await bridgePage.approveModal();
        console.log('Approved price impact modal and submitted swap');

        await verifySubmittedSwapTransaction({
          driver,
          quote: {
            amount: '1',
          },
          expectedTransactionsCount: 1,
          expectedStatus: 'success',
          expectedSwapTokens: {
            tokenFrom: 'ETH',
            tokenTo: 'MUSD',
          },
        });
      },
    );
  });
});
