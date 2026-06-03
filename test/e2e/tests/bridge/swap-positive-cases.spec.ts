/* eslint-disable @typescript-eslint/naming-convention */
import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { getEventPayloads, withFixtures } from '../../helpers';
import {
  bridgeTransaction,
  verifySubmittedSwapTransaction,
} from '../../page-objects/flows/bridge.flow';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from './constants';
import {
  getBridgeFixtures,
  mockTokensWithSecurityData,
} from './bridge-test-utils';

describe('Swap tests', function (this: Suite) {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout
  it('updates recommended swap quote incrementally when SSE events are received', async function () {
    await withFixtures(
      getBridgeFixtures({
        title: this.test?.fullTitle(),
        featureFlags: {
          ...BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
          refreshRate: 30000,
        },
        withErc20: false,
      }),
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
      getBridgeFixtures({
        title: this.test?.fullTitle(),
        featureFlags: BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
        withErc20: false,
      }),
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
          expectedDestAmount: '0.369',
          skipStatusPage: true,
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
          quotesReceivedEvent.properties.provider === '0x_0x',
          `Provider validation failed. Actual value: ${quotesReceivedEvent.properties.provider}`,
        );
        // assert.ok(
        //   quotesReceivedEvent.properties.usd_quoted_gas === 23.15898006845514,
        //   `Quoted gas validation failed. Actual value: ${quotesReceivedEvent.properties.usd_quoted_gas}`,
        // );
      },
    );
  });

  it('submits swap with token alert', async function () {
    const MUSD_SECURITY_DATA = {
      type: 'Malicious',
      metadata: {
        features: [
          {
            featureId: 'HONEYPOT',
            type: 'Malicious',
            description: 'Honeypot risk',
          },
        ],
      },
    };
    const fixtures = getBridgeFixtures({
      title: this.test?.fullTitle(),
      featureFlags: {
        ...BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
        refreshRate: 30000,
      },
    });
    const originalMock = fixtures.testSpecificMock;

    await withFixtures(
      {
        ...fixtures,
        testSpecificMock: async (mockServer: Mockttp) => {
          const baseMocks = originalMock ? await originalMock(mockServer) : [];
          await mockTokensWithSecurityData(mockServer, MUSD_SECURITY_DATA);
          return baseMocks;
        },
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();

        console.log('Requesting swap quote');
        const bridgePage = new BridgeQuotePage(driver);
        // Explicitly select MUSD so the token comes from the API with securityData
        await bridgePage.enterBridgeQuote({
          amount: '1',
          tokenTo: 'mUSD',
        });
        await bridgePage.waitForQuote();

        // 1 banner: token-security
        await bridgePage.submitQuoteWithWarning(1);
        await bridgePage.rejectModal();
        console.log('Rejected token alert modal');

        // Re-submit and approve the single confirmation alert (token-security) → tx submits
        await bridgePage.submitQuoteWithWarning();
        await bridgePage.approveModal();
        console.log('Approved token alert modal and submitted swap');

        await bridgePage.dismissStatusPageIfPresent();

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
    const MUSD_SECURITY_DATA = {
      type: 'Malicious',
      metadata: {
        features: [
          {
            featureId: 'HONEYPOT',
            type: 'Malicious',
            description: 'Honeypot risk',
          },
          {
            featureId: 'AIRDROP_PATTERN',
            type: 'Warning',
            description: 'Suspicious airdrop',
          },
          {
            featureId: 'UNKNOWN_TOKEN_ALERT',
            type: 'Malicious',
            description: 'Unknown alert',
          },
        ],
      },
    };
    const fixtures = getBridgeFixtures({
      title: this.test?.fullTitle(),
      featureFlags: {
        ...BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
        refreshRate: 120000,
        priceImpactThreshold: {
          ...BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED.priceImpactThreshold,
          gasless: 0.01,
          normal: 0.01,
          warning: 0.25,
          error: 0.0001,
        },
      },
    });
    const originalMock = fixtures.testSpecificMock;

    await withFixtures(
      {
        ...fixtures,
        testSpecificMock: async (mockServer: Mockttp) => {
          const baseMocks = originalMock ? await originalMock(mockServer) : [];
          await mockTokensWithSecurityData(mockServer, MUSD_SECURITY_DATA);
          return baseMocks;
        },
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();

        const bridgePage = new BridgeQuotePage(driver);

        console.log('Requesting swap quote');
        await bridgePage.enterBridgeQuote({
          amount: '1',
          tokenTo: 'mUSD',
        });
        await bridgePage.waitForQuote();
        await bridgePage.checkPriceImpactModalIsDisplayed();

        // 2 banners: token-security + price-impact
        await bridgePage.submitQuoteWithWarning(2);
        await bridgePage.rejectModal();
        console.log('Rejected confirmation modal on first alert');

        // Re-submit and approve both confirmation alerts (token-security + price-impact) → tx submits
        await bridgePage.submitQuoteWithWarning();
        await bridgePage.approveModal();
        await bridgePage.approveModal();
        console.log('Approved all confirmation alerts and submitted swap');

        await bridgePage.dismissStatusPageIfPresent();

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
    const MUSD_SECURITY_DATA = {
      type: 'Malicious',
      metadata: {
        features: [
          {
            featureId: 'HONEYPOT',
            type: 'Malicious',
            description: 'Honeypot risk',
          },
        ],
      },
    };
    const fixtures = getBridgeFixtures({
      title: this.test?.fullTitle(),
      featureFlags: {
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
    });
    const originalMock = fixtures.testSpecificMock;

    await withFixtures(
      {
        ...fixtures,
        testSpecificMock: async (mockServer: Mockttp) => {
          const baseMocks = originalMock ? await originalMock(mockServer) : [];
          await mockTokensWithSecurityData(mockServer, MUSD_SECURITY_DATA);
          return baseMocks;
        },
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();

        const bridgePage = new BridgeQuotePage(driver);

        console.log('Requesting swap quote');
        await bridgePage.enterBridgeQuote({
          amount: '1',
          tokenTo: 'mUSD',
        });
        await bridgePage.waitForQuote();

        // 2 confirmation alerts: token-security + price-impact
        await bridgePage.submitQuoteWithWarning();
        await bridgePage.rejectModal();
        console.log('Rejected confirmation modal');

        // Approve both alerts → tx submits
        await bridgePage.submitQuoteWithWarning();
        await bridgePage.approveModal();
        await bridgePage.approveModal();
        console.log('Approved all alerts and submitted swap');

        await bridgePage.dismissStatusPageIfPresent();

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
