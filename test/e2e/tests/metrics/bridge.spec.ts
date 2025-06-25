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
        await homePage.check_expectedBalanceIsDisplayed('24');

        await bridgeTransaction(driver, quote, 2, '24.9');

        // Start the flow again
        await homePage.startBridgeFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.enterBridgeQuote(quote);
        await bridgePage.waitForQuote();
        await bridgePage.check_expectedNetworkFeeIsDisplayed();
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
            swapBridgeButtonClicked[0].properties.token_symbol_destination ===
              null &&
            swapBridgeButtonClicked[0].properties.token_address_source ===
              'eip155:1/slip44:60' &&
            swapBridgeButtonClicked[0].properties.category ===
              'Unified SwapBridge' &&
            swapBridgeButtonClicked[0].properties.token_address_destination ===
              null,
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
              'Unified SwapBridge' &&
            swapBridgePageViewed[0].properties.token_address_destination ===
              null,
        );

        const swapBridgeInputChanged = findEventsByName(
          EventTypes.SwapBridgeInputChanged,
        );
        /**
         * token_source
         * token_destination
         * chain_source
         * chain_destination
         * slippage
         */

        assert.ok(swapBridgeInputChanged.length === 14);

        const inputTypes = [
          'token_source',
          'token_destination',
          'chain_source',
          'chain_destination',
          'slippage',
        ];
        const hasAllInputs = inputTypes.every((inputType) =>
          swapBridgeInputChanged.some(
            (event) =>
              event.event === EventTypes.SwapBridgeInputChanged &&
              event.properties.input === inputType,
          ),
        );
        assert.ok(hasAllInputs, 'Should have all 5 input types');

        const swapBridgeQuotesRequested = findEventsByName(
          EventTypes.SwapBridgeQuotesRequested,
        );
        assert.ok(swapBridgeQuotesRequested.length === 3);
        assert.ok(
          swapBridgeQuotesRequested[0].properties.chain_id_source ===
            'eip155:1' &&
            swapBridgeQuotesRequested[0].properties.chain_id_destination ===
              'eip155:59144' &&
            swapBridgeQuotesRequested[0].properties.token_address_source ===
              'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f' &&
            swapBridgeQuotesRequested[0].properties
              .token_address_destination === 'eip155:59144/slip44:60' &&
            swapBridgeQuotesRequested[0].properties.swap_type ===
              'crosschain' &&
            swapBridgeQuotesRequested[0].properties.token_symbol_source ===
              'DAI' &&
            swapBridgeQuotesRequested[0].properties.token_symbol_destination ===
              'ETH',
        );

        const crossChainQuotesReceived = findEventsByName(
          EventTypes.CrossChainQuotesReceived,
        );
        // The flow receives 2 quotes, so we expect 2 events
        assert.ok(crossChainQuotesReceived.length === 2);
        assert.ok(
          crossChainQuotesReceived[0].properties.chain_id_source ===
            'eip155:1' &&
            crossChainQuotesReceived[0].properties.chain_id_destination ===
              'eip155:59144' &&
            crossChainQuotesReceived[0].properties.token_address_source ===
              '0x6b175474e89094c44da98b954eedeac495271d0f' &&
            crossChainQuotesReceived[0].properties.token_address_destination ===
              '0x0000000000000000000000000000000000000000' &&
            crossChainQuotesReceived[0].properties.swap_type ===
              'crosschain-v1' &&
            crossChainQuotesReceived[0].properties.token_symbol_source ===
              'DAI' &&
            crossChainQuotesReceived[0].properties.token_symbol_destination ===
              'ETH',
        );

        const actionSubmitted = findEventsByName(EventTypes.ActionSubmitted);
        assert.ok(actionSubmitted.length === 1);
        assert.ok(
          actionSubmitted[0].properties.action_type === 'crosschain-v1' &&
            actionSubmitted[0].properties.category === 'Cross Chain Swaps' &&
            actionSubmitted[0].properties.token_address_source ===
              '0x6b175474e89094c44da98b954eedeac495271d0f' &&
            actionSubmitted[0].properties.token_address_destination ===
              '0x0000000000000000000000000000000000000000' &&
            actionSubmitted[0].properties.token_symbol_source === 'DAI' &&
            actionSubmitted[0].properties.token_symbol_destination === 'ETH',
        );

        const unifiedSwapBridgeSubmitted = findEventsByName(
          EventTypes.UnifiedSwapBridgeSubmitted,
        );

        assert.ok(unifiedSwapBridgeSubmitted.length === 1);
        assert.ok(
          unifiedSwapBridgeSubmitted[0].properties.action_type ===
            'crosschain-v1' &&
            unifiedSwapBridgeSubmitted[0].properties.category ===
              'Unified SwapBridge' &&
            unifiedSwapBridgeSubmitted[0].properties.token_address_source ===
              'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f' &&
            unifiedSwapBridgeSubmitted[0].properties
              .token_address_destination === 'eip155:59144/slip44:60' &&
            unifiedSwapBridgeSubmitted[0].properties.token_symbol_source ===
              'DAI' &&
            unifiedSwapBridgeSubmitted[0].properties
              .token_symbol_destination === 'ETH',
        );

        const assetTypeCheck1 = [
          (req: {
            properties: { asset_type: string; token_standard: string };
          }) => req.properties.asset_type === 'TOKEN',
          (req: {
            properties: { asset_type: string; token_standard: string };
          }) => req.properties.token_standard === 'ERC20',
        ];
        const assetTypeCheck2 = [
          (req: {
            properties: { asset_type: string; token_standard: string };
          }) => req.properties.asset_type === 'NATIVE',
          (req: {
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
            'crosschain-v1' &&
            swapBridgeCompletedEvents[0].properties.category ===
              'Unified SwapBridge' &&
            swapBridgeCompletedEvents[0].properties.token_address_source ===
              'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f' &&
            swapBridgeCompletedEvents[0].properties
              .token_address_destination === 'eip155:59144/slip44:60' &&
            swapBridgeCompletedEvents[0].properties.token_symbol_source ===
              'DAI' &&
            swapBridgeCompletedEvents[0].properties.token_symbol_destination ===
              'ETH',
        );

        const swapBridgeTokenFlippedEvents = findEventsByName(
          EventTypes.SwapBridgeTokenFlipped,
        );
        assert.ok(swapBridgeTokenFlippedEvents.length === 1);
      },
    );
  });
});
