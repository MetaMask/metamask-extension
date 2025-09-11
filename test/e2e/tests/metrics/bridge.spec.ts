import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import {
  assertInAnyOrder,
  getEventPayloads,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import { DEFAULT_BRIDGE_FEATURE_FLAGS } from '../bridge/constants';
import {
  bridgeTransaction,
  getBridgeFixtures,
  EventTypes,
  EXPECTED_EVENT_TYPES,
} from '../bridge/bridge-test-utils';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';

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
      getBridgeFixtures(
        this.test?.fullTitle(),
        DEFAULT_BRIDGE_FEATURE_FLAGS,
        false,
        true,
      ),
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);

        const homePage = new HomePage(driver);

        await bridgeTransaction(driver, quote, 2);

        // Start the flow again
        await homePage.startBridgeFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.enterBridgeQuote(quote);
        await bridgePage.waitForQuote();
        await bridgePage.checkExpectedNetworkFeeIsDisplayed();
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

        const bridgeLinkClicked = findEventsByName(
          EventTypes.BridgeLinkClicked,
        );
        // The flow above navigates twice to the bridge page, so we expect 2 events
        assert.ok(bridgeLinkClicked.length === 2);

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

        const swapBridgeInputChanged = findEventsByName(
          EventTypes.SwapBridgeInputChanged,
        );
        /**
         * token_source
         * chain_source
         * slippage
         * token_destination
         * chain_destination
         */

        assert(
          swapBridgeInputChanged.length === 20,
          'Should have at least 20 input change events',
        );

        const swapBridgeInputChangedKeys = new Set(
          swapBridgeInputChanged.map((event) => event.properties.input),
        );

        const inputTypes = [
          'token_source',
          'chain_source',
          'slippage',
          'token_destination',
          'chain_destination',
        ];

        assert.ok(
          swapBridgeInputChangedKeys.size === 5,
          'Should have 5 input types',
        );

        inputTypes.forEach((inputType) => {
          assert.ok(
            swapBridgeInputChangedKeys.has(inputType),
            `Missing input type: ${inputType}`,
          );
        });

        const swapBridgeQuotesRequested = findEventsByName(
          EventTypes.SwapBridgeQuotesRequested,
        );

        // Quotes can be requested while test is waiting for ui updates, so we expect at least 2 events
        assert.ok(swapBridgeQuotesRequested.length >= 2);
        const firstQuoteRequest = swapBridgeQuotesRequested.find((event) => {
          return (
            event.properties.chain_id_source === 'eip155:1' &&
            event.properties.chain_id_destination === 'eip155:59144' &&
            event.properties.token_address_source ===
              'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f' &&
            event.properties.token_address_destination ===
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
        // The flow receives 2 quotes, so we expect 2 events
        assert.ok(crossChainQuotesReceived.length === 2);
        assert.ok(
          crossChainQuotesReceived[0].properties.chain_id_source ===
            'eip155:1' &&
            crossChainQuotesReceived[0].properties.chain_id_destination ===
              'eip155:59144' &&
            crossChainQuotesReceived[0].properties.token_address_source ===
              'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f' &&
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

        const swapBridgeTokenFlippedEvents = findEventsByName(
          EventTypes.SwapBridgeTokenSwitched,
        );
        assert.ok(swapBridgeTokenFlippedEvents.length === 1);
      },
    );
  });
});
