import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import {
  assertInAnyOrder,
  getEventPayloads,
  withFixtures,
} from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import { DEFAULT_BRIDGE_FEATURE_FLAGS } from '../bridge/constants';
import { bridgeTransaction } from '../../page-objects/flows/bridge.flow';
import {
  getBridgeFixtures,
  EventTypes,
  EXPECTED_EVENT_TYPES,
  checkInputChangedEvents,
} from '../bridge/bridge-test-utils';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import { login } from '../../page-objects/flows/login.flow';

const quote = {
  amount: '25',
  tokenFrom: 'DAI',
  tokenTo: 'ETH',
  fromChain: 'Ethereum',
  toChain: 'Linea',
};

describe('Bridge tests', function (this: Suite) {
  this.timeout(160000);
  it('Execute multiple bridge transactions', async function () {
    await withFixtures(
      getBridgeFixtures({
        title: this.test?.fullTitle(),
        featureFlags: DEFAULT_BRIDGE_FEATURE_FLAGS,
        withErc20: false,
      }),
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await login(driver, {
          expectedBalance: '0',
          waitForNonEvmAccounts: false,
        });

        const homePage = new HomePage(driver);
        const bridgePage = new BridgeQuotePage(driver);

        // QUOTE REQUEST #1
        console.log('Starting 1st Swap flow');
        await bridgeTransaction({
          driver,
          quote,
          expectedTransactionsCount: 2,
          expectedDestAmount: '0.0157',
        });

        const inputChangesCount1 = await checkInputChangedEvents(
          'quoteRequest1',
          driver,
          mockedEndpoints,
        );

        // QUOTE REQUEST #2 - Start the flow again
        console.log('Starting 2nd Swap flow');
        await homePage.startSwapFlow();

        const inputChangesCount2 = await checkInputChangedEvents(
          'resetPage',
          driver,
          mockedEndpoints,
          inputChangesCount1,
        );

        console.log('Entering 2nd Swap quote');
        await bridgePage.enterBridgeQuote(quote);
        await bridgePage.waitForQuote();
        await bridgePage.checkExpectedNetworkFeeIsDisplayed();

        const inputChangesCount3 = await checkInputChangedEvents(
          'quoteRequest2',
          driver,
          mockedEndpoints,
          inputChangesCount1 + inputChangesCount2,
        );

        // QUOTE REQUEST #3
        console.log('Switching tokens');
        await bridgePage.switchTokens();

        let events = await getEventPayloads(driver, mockedEndpoints);
        events = events.filter((event) => event !== null);
        assert.ok(events.length > 0, 'No valid events were captured');

        const findEventsByName = (name: string) =>
          events.filter((e) => e?.event === name);

        const missingEventTypes = EXPECTED_EVENT_TYPES.filter(
          (type) => !events.some((e) => e?.event === type),
        );

        if (missingEventTypes.length > 0) {
          assert.fail(
            `Missing expected event types: ${missingEventTypes.join(', ')}`,
          );
        }

        const swapBridgeButtonClicked = findEventsByName(
          EventTypes.SwapBridgeButtonClicked,
        );
        // The flow above navigates twice to the bridge page, so we expect 2 events
        assert.ok(swapBridgeButtonClicked.length === 2);
        assert.ok(
          swapBridgeButtonClicked[0].properties.token_symbol_source === 'ETH' &&
            swapBridgeButtonClicked[0].properties.token_address_source ===
              'eip155:1/slip44:60' &&
            swapBridgeButtonClicked[0].properties.category ===
              'Unified SwapBridge',
        );

        const swapBridgePageViewed = findEventsByName(
          EventTypes.SwapBridgePageViewed,
        );
        // The flow above navigates twice to the bridge page, so we expect 2 events
        assert.ok(swapBridgePageViewed.length === 2);
        assert.ok(
          swapBridgePageViewed[0].properties.token_address_source ===
            'eip155:1/slip44:60' &&
            swapBridgePageViewed[0].properties.category ===
              'Unified SwapBridge',
        );

        const inputChangesCount4 = await checkInputChangedEvents(
          'switchTokens',
          driver,
          mockedEndpoints,
          inputChangesCount3 + inputChangesCount2 + inputChangesCount1,
        );

        // Check total input change events
        const swapBridgeInputChanged = findEventsByName(
          EventTypes.SwapBridgeInputChanged,
        );
        const expectedInputChangeLength =
          inputChangesCount1 +
          inputChangesCount2 +
          inputChangesCount3 +
          inputChangesCount4;
        assert.equal(
          swapBridgeInputChanged.length,
          expectedInputChangeLength,
          `Should have ${expectedInputChangeLength} total input change events, but got ${swapBridgeInputChanged.length}`,
        );
        console.log(
          `${expectedInputChangeLength} expected Input Change events found`,
        );

        const swapBridgeQuotesRequested = findEventsByName(
          EventTypes.SwapBridgeQuotesRequested,
        );

        // Quotes can be requested while test is waiting for ui updates, so we expect at least 2 events
        assert.ok(swapBridgeQuotesRequested.length >= 2);
        const firstQuoteRequest = swapBridgeQuotesRequested.find((event) => {
          return (
            event.properties.chain_id_source === 'eip155:1' &&
            event.properties.chain_id_destination === 'eip155:59144' &&
            event.properties.token_address_source.toLowerCase() ===
              'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f'.toLowerCase() &&
            event.properties.token_address_destination.toLowerCase() ===
              'eip155:59144/slip44:60' &&
            event.properties.swap_type === 'crosschain' &&
            event.properties.token_symbol_source === 'DAI' &&
            event.properties.token_symbol_destination === 'ETH'
          );
        });
        assert.ok(firstQuoteRequest, 'First quote request not found');

        const crossChainQuotesReceived = findEventsByName(
          EventTypes.UnifiedSwapBridgeQuotesReceived,
        );
        // The flow request quotes 3 times, but the 2nd response may be cancelled
        // before QuotesReceived is emitted
        assert.ok(crossChainQuotesReceived.length >= 2);
        assert.ok(
          crossChainQuotesReceived[0].properties.chain_id_source ===
            'eip155:1' &&
            crossChainQuotesReceived[0].properties.chain_id_destination ===
              'eip155:59144' &&
            crossChainQuotesReceived[0].properties.token_address_source.toLowerCase() ===
              'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f'.toLowerCase() &&
            crossChainQuotesReceived[0].properties.token_address_destination ===
              'eip155:59144/slip44:60' &&
            crossChainQuotesReceived[0].properties.swap_type === 'crosschain',
        );

        const unifiedSwapBridgeSubmitted = findEventsByName(
          EventTypes.UnifiedSwapBridgeSubmitted,
        );

        assert.ok(unifiedSwapBridgeSubmitted.length === 1);
        assert.ok(
          unifiedSwapBridgeSubmitted[0].properties.action_type ===
            'swapbridge-v1' &&
            unifiedSwapBridgeSubmitted[0].properties.category ===
              'Unified SwapBridge' &&
            unifiedSwapBridgeSubmitted[0].properties.token_symbol_source ===
              'DAI' &&
            unifiedSwapBridgeSubmitted[0].properties
              .token_symbol_destination === 'ETH',
        );

        const assetTypeCheck1 = [
          (req: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            properties: { asset_type: string; token_standard: string };
          }) => req.properties.asset_type === 'TOKEN',
          (req: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            properties: { asset_type: string; token_standard: string };
          }) => req.properties.token_standard === 'ERC20',
        ];
        const assetTypeCheck2 = [
          (req: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            properties: { asset_type: string; token_standard: string };
          }) => req.properties.asset_type === 'NATIVE',
          (req: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            properties: { asset_type: string; token_standard: string };
          }) => req.properties.token_standard === 'NONE',
        ];

        const transactionAddedAnonEvents = findEventsByName(
          EventTypes.TransactionAddedAnon,
        );
        assert.ok(transactionAddedAnonEvents.length === 2);

        assert.ok(
          assertInAnyOrder(transactionAddedAnonEvents, [
            assetTypeCheck1,
            assetTypeCheck2,
          ]),
        );

        const transactionAddedEvents = findEventsByName(
          EventTypes.TransactionAdded,
        );
        assert.ok(transactionAddedEvents.length === 2);
        assert.ok(
          assertInAnyOrder(transactionAddedEvents, [
            assetTypeCheck1,
            assetTypeCheck2,
          ]),
        );

        const transactionSubmittedAnonEvents = findEventsByName(
          EventTypes.TransactionSubmittedAnon,
        );
        assert.ok(transactionSubmittedAnonEvents.length === 2);
        assert.ok(
          assertInAnyOrder(transactionSubmittedAnonEvents, [
            assetTypeCheck1,
            assetTypeCheck2,
          ]),
        );

        const transactionSubmittedEvents = findEventsByName(
          EventTypes.TransactionSubmitted,
        );
        assert.ok(transactionSubmittedEvents.length === 2);
        assert.ok(
          assertInAnyOrder(transactionSubmittedEvents, [
            assetTypeCheck1,
            assetTypeCheck2,
          ]),
        );

        const transactionApprovedAnonEvents = findEventsByName(
          EventTypes.TransactionApprovedAnon,
        );
        assert.ok(transactionApprovedAnonEvents.length === 2);
        assert.ok(
          assertInAnyOrder(transactionApprovedAnonEvents, [
            assetTypeCheck1,
            assetTypeCheck2,
          ]),
        );

        const transactionApprovedEvents = findEventsByName(
          EventTypes.TransactionApproved,
        );
        assert.ok(transactionApprovedEvents.length === 2);
        assert.ok(
          assertInAnyOrder(transactionApprovedEvents, [
            assetTypeCheck1,
            assetTypeCheck2,
          ]),
        );

        const transactionFinalizedAnonEvents = findEventsByName(
          EventTypes.TransactionFinalizedAnon,
        );
        assert.ok(transactionFinalizedAnonEvents.length === 2);
        assert.ok(
          assertInAnyOrder(transactionFinalizedAnonEvents, [
            assetTypeCheck1,
            assetTypeCheck2,
          ]),
        );

        const transactionFinalizedEvents = findEventsByName(
          EventTypes.TransactionFinalized,
        );
        assert.ok(transactionFinalizedEvents.length === 2);
        assert.ok(
          assertInAnyOrder(transactionFinalizedEvents, [
            assetTypeCheck1,
            assetTypeCheck2,
          ]),
        );

        const swapBridgeCompletedEvents = findEventsByName(
          EventTypes.SwapBridgeCompleted,
        );
        assert.ok(swapBridgeCompletedEvents.length === 1);
        assert.ok(
          swapBridgeCompletedEvents[0].properties.action_type ===
            'swapbridge-v1' &&
            swapBridgeCompletedEvents[0].properties.category ===
              'Unified SwapBridge' &&
            swapBridgeCompletedEvents[0].properties.token_symbol_source ===
              'DAI' &&
            swapBridgeCompletedEvents[0].properties.token_symbol_destination ===
              'ETH',
        );

        const swapBridgeTokenSwitchedEvents = findEventsByName(
          EventTypes.SwapBridgeTokenSwitched,
        );
        assert.ok(swapBridgeTokenSwitchedEvents.length === 1);
      },
    );
  });
});
