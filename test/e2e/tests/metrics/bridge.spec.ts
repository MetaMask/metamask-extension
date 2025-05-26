import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { getEventPayloads, unlockWallet, withFixtures } from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import { DEFAULT_BRIDGE_FEATURE_FLAGS } from '../bridge/constants';
import {
  bridgeTransaction,
  getBridgeFixtures,
} from '../bridge/bridge-test-utils';

// Expected event types
enum EventTypes {
  BridgeLinkClicked = 'Bridge Link Clicked',
  SwapBridgeButtonClicked = 'Unified SwapBridge Button Clicked',
  SwapBridgePageViewed = 'Unified SwapBridge Page Viewed',
  InputChanged = 'Input Changed',
  SwapBridgeInputChanged = 'Unified SwapBridge Input Changed',
  SwapBridgeQuotesRequested = 'Unified SwapBridge Quotes Requested',
  CrossChainQuotesReceived = 'Cross-chain Quotes Received',
  ActionSubmitted = 'Action Submitted',
  SwapBridgeSubmitted = 'Unified SwapBridge Submitted',
  TransactionAddedAnon = 'Transaction Added Anon',
  TransactionAdded = 'Transaction Added',
  TransactionSubmittedAnon = 'Transaction Submitted Anon',
  TransactionSubmitted = 'Transaction Submitted',
  TransactionApprovedAnon = 'Transaction Approved Anon',
  TransactionApproved = 'Transaction Approved',
  TransactionFinalizedAnon = 'Transaction Finalized Anon',
  TransactionFinalized = 'Transaction Finalized',
  SwapBridgeCompleted = 'Unified SwapBridge Completed',
}

const EXPECTED_EVENT_TYPES = Object.values(EventTypes);

/**
 * Creates mock endpoints for Segment tracking API calls
 *
 * @param mockServer - The mock server instance.
 * @returns Array of mocked endpoints
 */
async function mockSegment(mockServer: Mockttp) {
  const createSegmentMock = async (eventType: string) => {
    return await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: eventType }],
      })
      .always()
      .thenCallback(async (request) => {
        let bodyText = '';

        try {
          if (request.body.buffer) {
            bodyText = request.body.buffer.toString('utf8');
          } else {
            bodyText = JSON.stringify(request.body);
          }
        } catch (e) {
          bodyText = 'Unable to parse request body';
        }

        try {
          const parsedBody = JSON.parse(bodyText);
          console.log(`\n=== Segment API Request (${eventType}) ===`);
          console.log(JSON.stringify(parsedBody, null, 2));
          console.log('=== End Request ===\n');
        } catch (e) {
          console.log(`\n=== Segment API Request (${eventType}) - Raw ===`);
          console.log(bodyText);
          console.log('=== End Request ===\n');
        }

        return {
          statusCode: 200,
        };
      });
  };

  // Create mock endpoints for all event types
  const mocks = [];
  for (const eventType of EXPECTED_EVENT_TYPES) {
    mocks.push(await createSegmentMock(eventType));
  }

  return mocks;
}

describe('Bridge tests', function (this: Suite) {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout
  it('Execute multiple bridge transactions', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        DEFAULT_BRIDGE_FEATURE_FLAGS,
        false,
        mockSegment,
      ),
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed('24');

        await bridgeTransaction(
          driver,
          {
            amount: '25',
            tokenFrom: 'DAI',
            tokenTo: 'ETH',
            fromChain: 'Ethereum',
            toChain: 'Linea',
            unapproved: true,
          },
          2,
          '24.9',
        );

        let events = await getEventPayloads(driver, mockedEndpoints);
        events = events.filter((event) => event !== null);
        assert.ok(events.length > 0, 'No valid events were captured');

        const findEventByName = (name: string) =>
          events.find((e) => e?.event === name);
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

        let c = 0;
        for (const event of events) {
          console.log(`Event ${c}:`, event);
          c += 1;
        }

        // Bridge Link Clicked
        const bridgeLinkClickedEvent = findEventByName(
          EventTypes.BridgeLinkClicked,
        );
        if (bridgeLinkClickedEvent) {
          assert.ok(
            bridgeLinkClickedEvent.properties.location === 'Main View' &&
              bridgeLinkClickedEvent.properties.text === 'Bridge' &&
              bridgeLinkClickedEvent.properties.category === 'Navigation' &&
              bridgeLinkClickedEvent.properties.token_symbol === 'ETH' &&
              bridgeLinkClickedEvent.properties.chain_id === '0x1' &&
              bridgeLinkClickedEvent.properties.locale === 'en' &&
              bridgeLinkClickedEvent.properties.environment_type ===
                'fullscreen',
          );
        } else {
          assert.fail(`Could not find ${EventTypes.BridgeLinkClicked} event`);
        }

        // Unified SwapBridge Button Clicked
        const swapBridgeButtonClickedEvent = findEventByName(
          EventTypes.SwapBridgeButtonClicked,
        );
        if (swapBridgeButtonClickedEvent) {
          assert.ok(
            swapBridgeButtonClickedEvent.properties.location === 'Token View' &&
              swapBridgeButtonClickedEvent.properties.token_symbol_source ===
                'ETH' &&
              swapBridgeButtonClickedEvent.properties.chain_id === '0x1' &&
              swapBridgeButtonClickedEvent.properties.locale === 'en' &&
              swapBridgeButtonClickedEvent.properties.environment_type ===
                'background' &&
              swapBridgeButtonClickedEvent.properties.action_type ===
                'crosschain-v1' &&
              swapBridgeButtonClickedEvent.properties.chain_id_source ===
                'eip155:1' &&
              swapBridgeButtonClickedEvent.properties.chain_id_destination ===
                null &&
              swapBridgeButtonClickedEvent.properties.token_address_source ===
                'eip155:1/slip44:60' &&
              swapBridgeButtonClickedEvent.properties
                .token_address_destination === null &&
              swapBridgeButtonClickedEvent.properties
                .token_symbol_destination === null &&
              swapBridgeButtonClickedEvent.properties.environmentType ===
                'background' &&
              swapBridgeButtonClickedEvent.properties.category ===
                'Unified SwapBridge' &&
              typeof swapBridgeButtonClickedEvent.properties.actionId ===
                'string',
          );
        } else {
          assert.fail(
            `Could not find ${EventTypes.SwapBridgeButtonClicked} event`,
          );
        }

        // Unified SwapBridge Page Viewed
        const swapBridgePageViewedEvent = findEventByName(
          EventTypes.SwapBridgePageViewed,
        );
        if (swapBridgePageViewedEvent) {
          assert.ok(
            swapBridgePageViewedEvent.properties.chain_id_source ===
              'eip155:1' &&
              swapBridgePageViewedEvent.properties.chain_id_destination ===
                null &&
              swapBridgePageViewedEvent.properties.token_address_source ===
                'eip155:1/slip44:60' &&
              swapBridgePageViewedEvent.properties.token_address_destination ===
                null &&
              swapBridgePageViewedEvent.properties.action_type ===
                'crosschain-v1' &&
              swapBridgePageViewedEvent.properties.environmentType ===
                'background' &&
              swapBridgePageViewedEvent.properties.category ===
                'Unified SwapBridge' &&
              swapBridgePageViewedEvent.properties.locale === 'en' &&
              swapBridgePageViewedEvent.properties.chain_id === '0x1' &&
              swapBridgePageViewedEvent.properties.environment_type ===
                'background' &&
              typeof swapBridgePageViewedEvent.properties.actionId === 'string',
          );
        } else {
          assert.fail(
            `Could not find ${EventTypes.SwapBridgePageViewed} event`,
          );
        }

        // Input Changed (token_source)
        const inputChangedEvents = findEventsByName(EventTypes.InputChanged);
        const tokenSourceInputEvent = inputChangedEvents.find(
          (e) => e.properties.input === 'token_source',
        );
        if (tokenSourceInputEvent) {
          assert.ok(
            tokenSourceInputEvent.properties.action_type === 'crosschain-v1' &&
              tokenSourceInputEvent.properties.input === 'token_source' &&
              tokenSourceInputEvent.properties.value ===
                '0x6b175474e89094c44da98b954eedeac495271d0f' &&
              tokenSourceInputEvent.properties.category ===
                'Cross Chain Swaps' &&
              tokenSourceInputEvent.properties.locale === 'en' &&
              tokenSourceInputEvent.properties.chain_id === '0x1' &&
              tokenSourceInputEvent.properties.environment_type ===
                'fullscreen',
          );
        } else {
          assert.fail(
            `Could not find ${EventTypes.InputChanged} event for token_source`,
          );
        }

        // Input Changed (chain_destination)
        const chainDestinationInputEvent = inputChangedEvents.find(
          (e) => e.properties.input === 'chain_destination',
        );
        if (chainDestinationInputEvent) {
          assert.ok(
            chainDestinationInputEvent.properties.action_type ===
              'crosschain-v1' &&
              chainDestinationInputEvent.properties.input ===
                'chain_destination' &&
              chainDestinationInputEvent.properties.value === '0xe708' &&
              chainDestinationInputEvent.properties.category ===
                'Cross Chain Swaps' &&
              chainDestinationInputEvent.properties.locale === 'en' &&
              chainDestinationInputEvent.properties.chain_id === '0x1' &&
              chainDestinationInputEvent.properties.environment_type ===
                'fullscreen',
          );
        } else {
          assert.fail(
            `Could not find ${EventTypes.InputChanged} event for chain_destination`,
          );
        }

        // Unified SwapBridge Input Changed events
        const swapBridgeInputChangedEvents = findEventsByName(
          EventTypes.SwapBridgeInputChanged,
        );

        // Unified SwapBridge Input Changed (token_source) - filter for crosschain-v1 action_type
        const swapBridgeTokenSourceEvent = swapBridgeInputChangedEvents.find(
          (e) =>
            e.properties.input === 'token_source' &&
            e.properties.action_type === 'crosschain-v1',
        );
        if (swapBridgeTokenSourceEvent) {
          assert.ok(
            swapBridgeTokenSourceEvent.properties.action_type ===
              'crosschain-v1' &&
              swapBridgeTokenSourceEvent.properties.input === 'token_source' &&
              swapBridgeTokenSourceEvent.properties.environmentType ===
                'background' &&
              typeof swapBridgeTokenSourceEvent.properties.actionId ===
                'string' &&
              swapBridgeTokenSourceEvent.properties.category ===
                'Unified SwapBridge' &&
              swapBridgeTokenSourceEvent.properties.locale === 'en' &&
              swapBridgeTokenSourceEvent.properties.chain_id === '0x1' &&
              swapBridgeTokenSourceEvent.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail(
            `Could not find ${EventTypes.SwapBridgeInputChanged} event for token_source with crosschain-v1 action_type`,
          );
        }

        // Unified SwapBridge Input Changed (token_destination) - filter for crosschain-v1 action_type
        const swapBridgeTokenDestinationEvent =
          swapBridgeInputChangedEvents.find(
            (e) =>
              e.properties.input === 'token_destination' &&
              e.properties.action_type === 'crosschain-v1',
          );
        if (swapBridgeTokenDestinationEvent) {
          assert.ok(
            swapBridgeTokenDestinationEvent.properties.action_type ===
              'crosschain-v1' &&
              swapBridgeTokenDestinationEvent.properties.input ===
                'token_destination' &&
              swapBridgeTokenDestinationEvent.properties.environmentType ===
                'background' &&
              typeof swapBridgeTokenDestinationEvent.properties.actionId ===
                'string' &&
              swapBridgeTokenDestinationEvent.properties.category ===
                'Unified SwapBridge' &&
              swapBridgeTokenDestinationEvent.properties.locale === 'en' &&
              swapBridgeTokenDestinationEvent.properties.chain_id === '0x1' &&
              swapBridgeTokenDestinationEvent.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail(
            `Could not find ${EventTypes.SwapBridgeInputChanged} event for token_destination with crosschain-v1 action_type`,
          );
        }

        // Unified SwapBridge Input Changed (chain_source) - filter for crosschain-v1 action_type
        const swapBridgeChainSourceEvent = swapBridgeInputChangedEvents.find(
          (e) =>
            e.properties.input === 'chain_source' &&
            e.properties.action_type === 'crosschain-v1',
        );
        if (swapBridgeChainSourceEvent) {
          assert.ok(
            swapBridgeChainSourceEvent.properties.action_type ===
              'crosschain-v1' &&
              swapBridgeChainSourceEvent.properties.input === 'chain_source' &&
              swapBridgeChainSourceEvent.properties.environmentType ===
                'background' &&
              typeof swapBridgeChainSourceEvent.properties.actionId ===
                'string' &&
              swapBridgeChainSourceEvent.properties.category ===
                'Unified SwapBridge' &&
              swapBridgeChainSourceEvent.properties.locale === 'en' &&
              swapBridgeChainSourceEvent.properties.chain_id === '0x1' &&
              swapBridgeChainSourceEvent.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail(
            `Could not find ${EventTypes.SwapBridgeInputChanged} event for chain_source with crosschain-v1 action_type`,
          );
        }

        // Unified SwapBridge Input Changed (chain_destination) - filter for crosschain-v1 action_type
        const swapBridgeChainDestinationEvent =
          swapBridgeInputChangedEvents.find(
            (e) =>
              e.properties.input === 'chain_destination' &&
              e.properties.action_type === 'crosschain-v1',
          );
        if (swapBridgeChainDestinationEvent) {
          assert.ok(
            swapBridgeChainDestinationEvent.properties.action_type ===
              'crosschain-v1' &&
              swapBridgeChainDestinationEvent.properties.input ===
                'chain_destination' &&
              swapBridgeChainDestinationEvent.properties.environmentType ===
                'background' &&
              typeof swapBridgeChainDestinationEvent.properties.actionId ===
                'string' &&
              swapBridgeChainDestinationEvent.properties.category ===
                'Unified SwapBridge' &&
              swapBridgeChainDestinationEvent.properties.locale === 'en' &&
              swapBridgeChainDestinationEvent.properties.chain_id === '0x1' &&
              swapBridgeChainDestinationEvent.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail(
            `Could not find ${EventTypes.SwapBridgeInputChanged} event for chain_destination with crosschain-v1 action_type`,
          );
        }

        // Unified SwapBridge Input Changed (slippage) - filter for crosschain-v1 action_type
        const swapBridgeSlippageEvent = swapBridgeInputChangedEvents.find(
          (e) =>
            e.properties.input === 'slippage' &&
            e.properties.action_type === 'crosschain-v1',
        );
        if (swapBridgeSlippageEvent) {
          assert.ok(
            swapBridgeSlippageEvent.properties.action_type ===
              'crosschain-v1' &&
              swapBridgeSlippageEvent.properties.input === 'slippage' &&
              swapBridgeSlippageEvent.properties.environmentType ===
                'background' &&
              typeof swapBridgeSlippageEvent.properties.actionId === 'string' &&
              swapBridgeSlippageEvent.properties.category ===
                'Unified SwapBridge' &&
              swapBridgeSlippageEvent.properties.locale === 'en' &&
              swapBridgeSlippageEvent.properties.chain_id === '0x1' &&
              swapBridgeSlippageEvent.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail(
            `Could not find ${EventTypes.SwapBridgeInputChanged} event for slippage with crosschain-v1 action_type`,
          );
        }

        // Unified SwapBridge Quotes Requested
        const swapBridgeQuotesRequestedEvent = findEventByName(
          EventTypes.SwapBridgeQuotesRequested,
        );
        if (swapBridgeQuotesRequestedEvent) {
          assert.ok(
            swapBridgeQuotesRequestedEvent.properties.chain_id_source ===
              'eip155:1' &&
              swapBridgeQuotesRequestedEvent.properties.chain_id_destination ===
                'eip155:59144' &&
              swapBridgeQuotesRequestedEvent.properties.token_address_source ===
                'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f' &&
              swapBridgeQuotesRequestedEvent.properties
                .token_address_destination === 'eip155:59144/slip44:60' &&
              typeof swapBridgeQuotesRequestedEvent.properties
                .slippage_limit === 'number' &&
              swapBridgeQuotesRequestedEvent.properties.swap_type ===
                'crosschain' &&
              swapBridgeQuotesRequestedEvent.properties.is_hardware_wallet ===
                false &&
              swapBridgeQuotesRequestedEvent.properties.custom_slippage ===
                true &&
              swapBridgeQuotesRequestedEvent.properties.error_message ===
                null &&
              swapBridgeQuotesRequestedEvent.properties.has_sufficient_funds ===
                false &&
              swapBridgeQuotesRequestedEvent.properties.action_type ===
                'crosschain-v1' &&
              swapBridgeQuotesRequestedEvent.properties.stx_enabled === true &&
              swapBridgeQuotesRequestedEvent.properties.token_symbol_source ===
                'DAI' &&
              swapBridgeQuotesRequestedEvent.properties
                .token_symbol_destination === 'ETH' &&
              Array.isArray(
                swapBridgeQuotesRequestedEvent.properties.security_warnings,
              ) &&
              swapBridgeQuotesRequestedEvent.properties.environmentType ===
                'background' &&
              typeof swapBridgeQuotesRequestedEvent.properties.actionId ===
                'string' &&
              swapBridgeQuotesRequestedEvent.properties.category ===
                'Unified SwapBridge' &&
              swapBridgeQuotesRequestedEvent.properties.locale === 'en' &&
              swapBridgeQuotesRequestedEvent.properties.chain_id === '0x1' &&
              swapBridgeQuotesRequestedEvent.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail(
            `Could not find ${EventTypes.SwapBridgeQuotesRequested} event`,
          );
        }

        // Cross-chain Quotes Received
        const crossChainQuotesReceivedEvent = findEventByName(
          EventTypes.CrossChainQuotesReceived,
        );
        if (crossChainQuotesReceivedEvent) {
          assert.ok(
            crossChainQuotesReceivedEvent.properties.action_type ===
              'crosschain-v1' &&
              crossChainQuotesReceivedEvent.properties.chain_id_source ===
                'eip155:1' &&
              crossChainQuotesReceivedEvent.properties.chain_id_destination ===
                'eip155:59144' &&
              crossChainQuotesReceivedEvent.properties.token_symbol_source ===
                'DAI' &&
              crossChainQuotesReceivedEvent.properties
                .token_symbol_destination === 'ETH' &&
              crossChainQuotesReceivedEvent.properties.token_address_source ===
                '0x6b175474e89094c44da98b954eedeac495271d0f' &&
              crossChainQuotesReceivedEvent.properties
                .token_address_destination ===
                '0x0000000000000000000000000000000000000000' &&
              typeof crossChainQuotesReceivedEvent.properties.slippage_limit ===
                'number' &&
              crossChainQuotesReceivedEvent.properties.custom_slippage ===
                false &&
              crossChainQuotesReceivedEvent.properties.is_hardware_wallet ===
                false &&
              crossChainQuotesReceivedEvent.properties.swap_type ===
                'crosschain-v1' &&
              crossChainQuotesReceivedEvent.properties.stx_enabled === true &&
              crossChainQuotesReceivedEvent.properties.usd_amount_source ===
                25 &&
              crossChainQuotesReceivedEvent.properties.can_submit === true &&
              crossChainQuotesReceivedEvent.properties.best_quote_provider ===
                'lifi_across' &&
              crossChainQuotesReceivedEvent.properties.quotes_count === 1 &&
              Array.isArray(
                crossChainQuotesReceivedEvent.properties.quotes_list,
              ) &&
              crossChainQuotesReceivedEvent.properties.quotes_list.includes(
                'lifi_across',
              ) &&
              typeof crossChainQuotesReceivedEvent.properties
                .initial_load_time_all_quotes === 'number' &&
              crossChainQuotesReceivedEvent.properties.gas_included === false &&
              typeof crossChainQuotesReceivedEvent.properties
                .quoted_time_minutes === 'number' &&
              crossChainQuotesReceivedEvent.properties.provider ===
                'lifi_across' &&
              typeof crossChainQuotesReceivedEvent.properties.usd_quoted_gas ===
                'number' &&
              typeof crossChainQuotesReceivedEvent.properties
                .usd_quoted_return === 'number' &&
              crossChainQuotesReceivedEvent.properties.refresh_count === 0 &&
              Array.isArray(
                crossChainQuotesReceivedEvent.properties.warnings,
              ) &&
              crossChainQuotesReceivedEvent.properties.warnings.includes(
                'low_return',
              ) &&
              crossChainQuotesReceivedEvent.properties.category ===
                'Cross Chain Swaps' &&
              crossChainQuotesReceivedEvent.properties.locale === 'en' &&
              crossChainQuotesReceivedEvent.properties.chain_id === '0x1' &&
              crossChainQuotesReceivedEvent.properties.environment_type ===
                'fullscreen',
          );
        } else {
          assert.fail(
            `Could not find ${EventTypes.CrossChainQuotesReceived} event`,
          );
        }

        // Action Submitted
        const actionSubmittedEvent = findEventByName(
          EventTypes.ActionSubmitted,
        );
        if (actionSubmittedEvent) {
          assert.ok(
            actionSubmittedEvent.properties.action_type === 'crosschain-v1' &&
              actionSubmittedEvent.properties.chain_id_source === 'eip155:1' &&
              actionSubmittedEvent.properties.chain_id_destination ===
                'eip155:59144' &&
              actionSubmittedEvent.properties.token_symbol_source === 'DAI' &&
              actionSubmittedEvent.properties.token_symbol_destination ===
                'ETH' &&
              actionSubmittedEvent.properties.token_address_source ===
                '0x6b175474e89094c44da98b954eedeac495271d0f' &&
              actionSubmittedEvent.properties.token_address_destination ===
                '0x0000000000000000000000000000000000000000' &&
              actionSubmittedEvent.properties.slippage_limit === 0.5 &&
              actionSubmittedEvent.properties.custom_slippage === false &&
              actionSubmittedEvent.properties.is_hardware_wallet === false &&
              actionSubmittedEvent.properties.swap_type === 'crosschain-v1' &&
              actionSubmittedEvent.properties.stx_enabled === true &&
              actionSubmittedEvent.properties.usd_amount_source === 25 &&
              actionSubmittedEvent.properties.gas_included === false &&
              typeof actionSubmittedEvent.properties.quoted_time_minutes ===
                'number' &&
              actionSubmittedEvent.properties.provider === 'lifi_across' &&
              typeof actionSubmittedEvent.properties.usd_quoted_gas ===
                'number' &&
              typeof actionSubmittedEvent.properties.usd_quoted_return ===
                'number' &&
              actionSubmittedEvent.properties.category ===
                'Cross Chain Swaps' &&
              actionSubmittedEvent.properties.locale === 'en' &&
              actionSubmittedEvent.properties.chain_id === '0x1' &&
              actionSubmittedEvent.properties.environment_type === 'fullscreen',
          );
        } else {
          assert.fail(`Could not find ${EventTypes.ActionSubmitted} event`);
        }

        // Unified SwapBridge Submitted
        const swapBridgeSubmittedEvent = findEventByName(
          EventTypes.SwapBridgeSubmitted,
        );
        if (swapBridgeSubmittedEvent) {
          assert.ok(
            swapBridgeSubmittedEvent.properties.action_type ===
              'crosschain-v1' &&
              swapBridgeSubmittedEvent.properties.chain_id_source ===
                'eip155:1' &&
              swapBridgeSubmittedEvent.properties.token_symbol_source ===
                'DAI' &&
              swapBridgeSubmittedEvent.properties.token_address_source ===
                'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f' &&
              swapBridgeSubmittedEvent.properties.chain_id_destination ===
                'eip155:59144' &&
              swapBridgeSubmittedEvent.properties.token_symbol_destination ===
                'ETH' &&
              swapBridgeSubmittedEvent.properties.token_address_destination ===
                'eip155:59144/slip44:60' &&
              swapBridgeSubmittedEvent.properties.slippage_limit === 0 &&
              swapBridgeSubmittedEvent.properties.custom_slippage === true &&
              swapBridgeSubmittedEvent.properties.usd_amount_source === 25 &&
              swapBridgeSubmittedEvent.properties.swap_type === 'crosschain' &&
              swapBridgeSubmittedEvent.properties.is_hardware_wallet ===
                false &&
              swapBridgeSubmittedEvent.properties.stx_enabled === true &&
              Array.isArray(
                swapBridgeSubmittedEvent.properties.security_warnings,
              ) &&
              typeof swapBridgeSubmittedEvent.properties.usd_quoted_gas ===
                'number' &&
              swapBridgeSubmittedEvent.properties.gas_included === false &&
              swapBridgeSubmittedEvent.properties.provider === 'lifi_across' &&
              typeof swapBridgeSubmittedEvent.properties.quoted_time_minutes ===
                'number' &&
              typeof swapBridgeSubmittedEvent.properties.usd_quoted_return ===
                'number' &&
              swapBridgeSubmittedEvent.properties.approval_transaction ===
                'PENDING' &&
              swapBridgeSubmittedEvent.properties.source_transaction ===
                'PENDING' &&
              swapBridgeSubmittedEvent.properties.destination_transaction ===
                'PENDING' &&
              swapBridgeSubmittedEvent.properties.actual_time_minutes === 0 &&
              typeof swapBridgeSubmittedEvent.properties.usd_actual_return ===
                'number' &&
              typeof swapBridgeSubmittedEvent.properties.usd_actual_gas ===
                'number' &&
              swapBridgeSubmittedEvent.properties.quote_vs_execution_ratio ===
                1 &&
              swapBridgeSubmittedEvent.properties.quoted_vs_used_gas_ratio ===
                1 &&
              swapBridgeSubmittedEvent.properties.error_message ===
                'error_message' &&
              swapBridgeSubmittedEvent.properties.price_impact === 0 &&
              swapBridgeSubmittedEvent.properties.environmentType ===
                'background' &&
              typeof swapBridgeSubmittedEvent.properties.actionId ===
                'string' &&
              swapBridgeSubmittedEvent.properties.category ===
                'Unified SwapBridge' &&
              swapBridgeSubmittedEvent.properties.locale === 'en' &&
              swapBridgeSubmittedEvent.properties.chain_id === '0x1' &&
              swapBridgeSubmittedEvent.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail(`Could not find ${EventTypes.SwapBridgeSubmitted} event`);
        }

        // Transaction events - we need to handle multiple instances
        const transactionAddedAnonEvents = findEventsByName(
          EventTypes.TransactionAddedAnon,
        );
        const transactionAddedEvents = findEventsByName(
          EventTypes.TransactionAdded,
        );
        const transactionSubmittedAnonEvents = findEventsByName(
          EventTypes.TransactionSubmittedAnon,
        );
        const transactionSubmittedEvents = findEventsByName(
          EventTypes.TransactionSubmitted,
        );
        const transactionApprovedAnonEvents = findEventsByName(
          EventTypes.TransactionApprovedAnon,
        );
        const transactionApprovedEvents = findEventsByName(
          EventTypes.TransactionApproved,
        );
        const transactionFinalizedAnonEvents = findEventsByName(
          EventTypes.TransactionFinalizedAnon,
        );
        const transactionFinalizedEvents = findEventsByName(
          EventTypes.TransactionFinalized,
        );

        // Verify we have the expected number of transaction events
        assert.ok(
          transactionAddedAnonEvents.length >= 2,
          'Should have at least 2 Transaction Added Anon events',
        );
        assert.ok(
          transactionAddedEvents.length >= 2,
          'Should have at least 2 Transaction Added events',
        );
        assert.ok(
          transactionSubmittedAnonEvents.length >= 2,
          'Should have at least 2 Transaction Submitted Anon events',
        );
        assert.ok(
          transactionSubmittedEvents.length >= 2,
          'Should have at least 2 Transaction Submitted events',
        );
        assert.ok(
          transactionApprovedAnonEvents.length >= 2,
          'Should have at least 2 Transaction Approved Anon events',
        );
        assert.ok(
          transactionApprovedEvents.length >= 2,
          'Should have at least 2 Transaction Approved events',
        );
        assert.ok(
          transactionFinalizedAnonEvents.length >= 2,
          'Should have at least 2 Transaction Finalized Anon events',
        );
        assert.ok(
          transactionFinalizedEvents.length >= 2,
          'Should have at least 2 Transaction Finalized events',
        );

        // Test first Transaction Added Anon (ERC20 token transaction)
        const firstTransactionAddedAnon = transactionAddedAnonEvents[0];
        if (firstTransactionAddedAnon) {
          assert.ok(
            firstTransactionAddedAnon.properties.transaction_envelope_type ===
              'fee-market' &&
              typeof firstTransactionAddedAnon.properties.first_seen ===
                'number' &&
              firstTransactionAddedAnon.properties.gas_limit === '0x289254' &&
              Array.isArray(
                firstTransactionAddedAnon.properties
                  .transaction_contract_address,
              ) &&
              typeof firstTransactionAddedAnon.properties.max_fee_per_gas ===
                'string' &&
              typeof firstTransactionAddedAnon.properties
                .max_priority_fee_per_gas === 'string' &&
              firstTransactionAddedAnon.properties.default_estimate ===
                'medium' &&
              firstTransactionAddedAnon.properties.chain_id === '0x1' &&
              firstTransactionAddedAnon.properties.referrer === 'metamask' &&
              firstTransactionAddedAnon.properties.source === 'user' &&
              firstTransactionAddedAnon.properties.status === 'unapproved' &&
              firstTransactionAddedAnon.properties.network === '1' &&
              firstTransactionAddedAnon.properties.eip_1559_version === '2' &&
              firstTransactionAddedAnon.properties.gas_edit_type === 'none' &&
              firstTransactionAddedAnon.properties.gas_edit_attempted ===
                'none' &&
              firstTransactionAddedAnon.properties.gas_estimation_failed ===
                false &&
              firstTransactionAddedAnon.properties.account_type ===
                'MetaMask' &&
              firstTransactionAddedAnon.properties.asset_type === 'TOKEN' &&
              firstTransactionAddedAnon.properties.token_standard === 'ERC20' &&
              firstTransactionAddedAnon.properties.transaction_type ===
                'simpleSend' &&
              firstTransactionAddedAnon.properties.transaction_speed_up ===
                false &&
              typeof firstTransactionAddedAnon.properties
                .transaction_internal_id === 'string' &&
              firstTransactionAddedAnon.properties.gas_fee_selected ===
                'medium' &&
              firstTransactionAddedAnon.properties.transaction_advanced_view ===
                null &&
              Array.isArray(
                firstTransactionAddedAnon.properties
                  .transaction_contract_method,
              ) &&
              firstTransactionAddedAnon.properties.is_smart_transaction ===
                true &&
              firstTransactionAddedAnon.properties.hd_entropy_index === 0 &&
              firstTransactionAddedAnon.properties.api_method ===
                'eth_sendTransaction' &&
              firstTransactionAddedAnon.properties
                .eip7702_upgrade_transaction === false &&
              firstTransactionAddedAnon.properties
                .gas_insufficient_native_asset === false &&
              firstTransactionAddedAnon.properties.category ===
                'Transactions' &&
              firstTransactionAddedAnon.properties.locale === 'en' &&
              firstTransactionAddedAnon.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail('Could not find first Transaction Added Anon event');
        }

        // Test first Transaction Added (ERC20 token transaction)
        const firstTransactionAdded = transactionAddedEvents[0];
        if (firstTransactionAdded) {
          assert.ok(
            firstTransactionAdded.properties.chain_id === '0x1' &&
              firstTransactionAdded.properties.referrer === 'metamask' &&
              firstTransactionAdded.properties.source === 'user' &&
              firstTransactionAdded.properties.status === 'unapproved' &&
              firstTransactionAdded.properties.network === '1' &&
              firstTransactionAdded.properties.eip_1559_version === '2' &&
              firstTransactionAdded.properties.gas_edit_type === 'none' &&
              firstTransactionAdded.properties.gas_edit_attempted === 'none' &&
              firstTransactionAdded.properties.gas_estimation_failed ===
                false &&
              firstTransactionAdded.properties.account_type === 'MetaMask' &&
              firstTransactionAdded.properties.asset_type === 'TOKEN' &&
              firstTransactionAdded.properties.token_standard === 'ERC20' &&
              firstTransactionAdded.properties.transaction_type ===
                'simpleSend' &&
              firstTransactionAdded.properties.transaction_speed_up === false &&
              typeof firstTransactionAdded.properties
                .transaction_internal_id === 'string' &&
              firstTransactionAdded.properties.gas_fee_selected === 'medium' &&
              firstTransactionAdded.properties.transaction_advanced_view ===
                null &&
              Array.isArray(
                firstTransactionAdded.properties.transaction_contract_method,
              ) &&
              firstTransactionAdded.properties.is_smart_transaction === true &&
              firstTransactionAdded.properties.hd_entropy_index === 0 &&
              firstTransactionAdded.properties.api_method ===
                'eth_sendTransaction' &&
              firstTransactionAdded.properties.eip7702_upgrade_transaction ===
                false &&
              firstTransactionAdded.properties.gas_insufficient_native_asset ===
                false &&
              firstTransactionAdded.properties.category === 'Transactions' &&
              firstTransactionAdded.properties.locale === 'en' &&
              firstTransactionAdded.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail('Could not find first Transaction Added event');
        }

        // Test first Transaction Submitted Anon (ERC20 token transaction)
        const firstTransactionSubmittedAnon = transactionSubmittedAnonEvents[0];
        if (firstTransactionSubmittedAnon) {
          assert.ok(
            firstTransactionSubmittedAnon.properties
              .transaction_envelope_type === 'fee-market' &&
              typeof firstTransactionSubmittedAnon.properties.first_seen ===
                'number' &&
              firstTransactionSubmittedAnon.properties.gas_limit ===
                '0x289254' &&
              firstTransactionSubmittedAnon.properties.status === 'submitted' &&
              firstTransactionSubmittedAnon.properties.asset_type === 'TOKEN' &&
              firstTransactionSubmittedAnon.properties.token_standard ===
                'ERC20' &&
              firstTransactionSubmittedAnon.properties.rpc_domain ===
                'private' &&
              firstTransactionSubmittedAnon.properties.category ===
                'Transactions' &&
              firstTransactionSubmittedAnon.properties.locale === 'en' &&
              firstTransactionSubmittedAnon.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail('Could not find first Transaction Submitted Anon event');
        }

        // Test first Transaction Submitted (ERC20 token transaction)
        const firstTransactionSubmitted = transactionSubmittedEvents[0];
        if (firstTransactionSubmitted) {
          assert.ok(
            firstTransactionSubmitted.properties.chain_id === '0x1' &&
              firstTransactionSubmitted.properties.status === 'submitted' &&
              firstTransactionSubmitted.properties.asset_type === 'TOKEN' &&
              firstTransactionSubmitted.properties.token_standard === 'ERC20' &&
              firstTransactionSubmitted.properties.rpc_domain === 'private' &&
              firstTransactionSubmitted.properties.category ===
                'Transactions' &&
              firstTransactionSubmitted.properties.locale === 'en' &&
              firstTransactionSubmitted.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail('Could not find first Transaction Submitted event');
        }

        // Test first Transaction Approved Anon (ERC20 token transaction)
        const firstTransactionApprovedAnon = transactionApprovedAnonEvents[0];
        if (firstTransactionApprovedAnon) {
          assert.ok(
            firstTransactionApprovedAnon.properties.status === 'submitted' &&
              firstTransactionApprovedAnon.properties.asset_type === 'TOKEN' &&
              firstTransactionApprovedAnon.properties.token_standard ===
                'ERC20' &&
              firstTransactionApprovedAnon.properties.rpc_domain ===
                'private' &&
              firstTransactionApprovedAnon.properties.category ===
                'Transactions' &&
              firstTransactionApprovedAnon.properties.locale === 'en' &&
              firstTransactionApprovedAnon.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail('Could not find first Transaction Approved Anon event');
        }

        // Test first Transaction Approved (ERC20 token transaction)
        const firstTransactionApproved = transactionApprovedEvents[0];
        if (firstTransactionApproved) {
          assert.ok(
            firstTransactionApproved.properties.status === 'submitted' &&
              firstTransactionApproved.properties.asset_type === 'TOKEN' &&
              firstTransactionApproved.properties.token_standard === 'ERC20' &&
              firstTransactionApproved.properties.rpc_domain === 'private' &&
              firstTransactionApproved.properties.category === 'Transactions' &&
              firstTransactionApproved.properties.locale === 'en' &&
              firstTransactionApproved.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail('Could not find first Transaction Approved event');
        }

        // Test second Transaction Added Anon (NATIVE asset transaction)
        const secondTransactionAddedAnon = transactionAddedAnonEvents[1];
        if (secondTransactionAddedAnon) {
          assert.ok(
            secondTransactionAddedAnon.properties.transaction_envelope_type ===
              'fee-market' &&
              typeof secondTransactionAddedAnon.properties.first_seen ===
                'number' &&
              secondTransactionAddedAnon.properties.gas_limit === '0x6ea9f' &&
              secondTransactionAddedAnon.properties.status === 'unapproved' &&
              secondTransactionAddedAnon.properties.asset_type === 'NATIVE' &&
              secondTransactionAddedAnon.properties.token_standard === 'NONE' &&
              secondTransactionAddedAnon.properties.category ===
                'Transactions' &&
              secondTransactionAddedAnon.properties.locale === 'en' &&
              secondTransactionAddedAnon.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail('Could not find second Transaction Added Anon event');
        }

        // Test second Transaction Added (NATIVE asset transaction)
        const secondTransactionAdded = transactionAddedEvents[1];
        if (secondTransactionAdded) {
          assert.ok(
            secondTransactionAdded.properties.status === 'unapproved' &&
              secondTransactionAdded.properties.asset_type === 'NATIVE' &&
              secondTransactionAdded.properties.token_standard === 'NONE' &&
              secondTransactionAdded.properties.category === 'Transactions' &&
              secondTransactionAdded.properties.locale === 'en' &&
              secondTransactionAdded.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail('Could not find second Transaction Added event');
        }

        // Test second Transaction Submitted Anon (NATIVE asset transaction)
        const secondTransactionSubmittedAnon =
          transactionSubmittedAnonEvents[1];
        if (secondTransactionSubmittedAnon) {
          assert.ok(
            secondTransactionSubmittedAnon.properties.gas_limit === '0x6ea9f' &&
              secondTransactionSubmittedAnon.properties.status ===
                'submitted' &&
              secondTransactionSubmittedAnon.properties.asset_type ===
                'NATIVE' &&
              secondTransactionSubmittedAnon.properties.token_standard ===
                'NONE' &&
              secondTransactionSubmittedAnon.properties.rpc_domain ===
                'private' &&
              secondTransactionSubmittedAnon.properties.category ===
                'Transactions' &&
              secondTransactionSubmittedAnon.properties.locale === 'en' &&
              secondTransactionSubmittedAnon.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail('Could not find second Transaction Submitted Anon event');
        }

        // Test second Transaction Submitted (NATIVE asset transaction)
        const secondTransactionSubmitted = transactionSubmittedEvents[1];
        if (secondTransactionSubmitted) {
          assert.ok(
            secondTransactionSubmitted.properties.status === 'submitted' &&
              secondTransactionSubmitted.properties.asset_type === 'NATIVE' &&
              secondTransactionSubmitted.properties.token_standard === 'NONE' &&
              secondTransactionSubmitted.properties.rpc_domain === 'private' &&
              secondTransactionSubmitted.properties.category ===
                'Transactions' &&
              secondTransactionSubmitted.properties.locale === 'en' &&
              secondTransactionSubmitted.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail('Could not find second Transaction Submitted event');
        }

        // Test second Transaction Approved Anon (NATIVE asset transaction)
        const secondTransactionApprovedAnon = transactionApprovedAnonEvents[1];
        if (secondTransactionApprovedAnon) {
          assert.ok(
            secondTransactionApprovedAnon.properties.status === 'submitted' &&
              secondTransactionApprovedAnon.properties.asset_type ===
                'NATIVE' &&
              secondTransactionApprovedAnon.properties.token_standard ===
                'NONE' &&
              secondTransactionApprovedAnon.properties.rpc_domain ===
                'private' &&
              secondTransactionApprovedAnon.properties.category ===
                'Transactions' &&
              secondTransactionApprovedAnon.properties.locale === 'en' &&
              secondTransactionApprovedAnon.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail('Could not find second Transaction Approved Anon event');
        }

        // Test second Transaction Approved (NATIVE asset transaction)
        const secondTransactionApproved = transactionApprovedEvents[1];
        if (secondTransactionApproved) {
          assert.ok(
            secondTransactionApproved.properties.status === 'submitted' &&
              secondTransactionApproved.properties.asset_type === 'NATIVE' &&
              secondTransactionApproved.properties.token_standard === 'NONE' &&
              secondTransactionApproved.properties.rpc_domain === 'private' &&
              secondTransactionApproved.properties.category ===
                'Transactions' &&
              secondTransactionApproved.properties.locale === 'en' &&
              secondTransactionApproved.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail('Could not find second Transaction Approved event');
        }

        // Test first Transaction Finalized Anon (ERC20 token transaction)
        const firstTransactionFinalizedAnon = transactionFinalizedAnonEvents[0];
        if (firstTransactionFinalizedAnon) {
          assert.ok(
            firstTransactionFinalizedAnon.properties.gas_limit === '0x289254' &&
              typeof firstTransactionFinalizedAnon.properties.gas_used ===
                'string' &&
              typeof firstTransactionFinalizedAnon.properties.block_number ===
                'string' &&
              typeof firstTransactionFinalizedAnon.properties
                .completion_time === 'string' &&
              typeof firstTransactionFinalizedAnon.properties
                .completion_time_onchain === 'string' &&
              firstTransactionFinalizedAnon.properties.status === 'confirmed' &&
              firstTransactionFinalizedAnon.properties.asset_type === 'TOKEN' &&
              firstTransactionFinalizedAnon.properties.token_standard ===
                'ERC20' &&
              firstTransactionFinalizedAnon.properties.rpc_domain ===
                'private' &&
              firstTransactionFinalizedAnon.properties.category ===
                'Transactions' &&
              firstTransactionFinalizedAnon.properties.locale === 'en' &&
              firstTransactionFinalizedAnon.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail('Could not find first Transaction Finalized Anon event');
        }

        // Test first Transaction Finalized (ERC20 token transaction)
        const firstTransactionFinalized = transactionFinalizedEvents[0];
        if (firstTransactionFinalized) {
          assert.ok(
            firstTransactionFinalized.properties.status === 'confirmed' &&
              firstTransactionFinalized.properties.asset_type === 'TOKEN' &&
              firstTransactionFinalized.properties.token_standard === 'ERC20' &&
              firstTransactionFinalized.properties.rpc_domain === 'private' &&
              firstTransactionFinalized.properties.category ===
                'Transactions' &&
              firstTransactionFinalized.properties.locale === 'en' &&
              firstTransactionFinalized.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail('Could not find first Transaction Finalized event');
        }

        // Test second Transaction Finalized Anon (NATIVE asset transaction)
        const secondTransactionFinalizedAnon =
          transactionFinalizedAnonEvents[1];
        if (secondTransactionFinalizedAnon) {
          assert.ok(
            secondTransactionFinalizedAnon.properties.gas_limit === '0x6ea9f' &&
              typeof secondTransactionFinalizedAnon.properties.gas_used ===
                'string' &&
              typeof secondTransactionFinalizedAnon.properties.block_number ===
                'string' &&
              typeof secondTransactionFinalizedAnon.properties
                .completion_time === 'string' &&
              typeof secondTransactionFinalizedAnon.properties
                .completion_time_onchain === 'string' &&
              secondTransactionFinalizedAnon.properties.status ===
                'confirmed' &&
              secondTransactionFinalizedAnon.properties.asset_type ===
                'NATIVE' &&
              secondTransactionFinalizedAnon.properties.token_standard ===
                'NONE' &&
              secondTransactionFinalizedAnon.properties.rpc_domain ===
                'private' &&
              secondTransactionFinalizedAnon.properties.category ===
                'Transactions' &&
              secondTransactionFinalizedAnon.properties.locale === 'en' &&
              secondTransactionFinalizedAnon.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail('Could not find second Transaction Finalized Anon event');
        }

        // Test second Transaction Finalized (NATIVE asset transaction)
        const secondTransactionFinalized = transactionFinalizedEvents[1];
        if (secondTransactionFinalized) {
          assert.ok(
            secondTransactionFinalized.properties.status === 'confirmed' &&
              secondTransactionFinalized.properties.asset_type === 'NATIVE' &&
              secondTransactionFinalized.properties.token_standard === 'NONE' &&
              secondTransactionFinalized.properties.rpc_domain === 'private' &&
              secondTransactionFinalized.properties.category ===
                'Transactions' &&
              secondTransactionFinalized.properties.locale === 'en' &&
              secondTransactionFinalized.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail('Could not find second Transaction Finalized event');
        }

        // Unified SwapBridge Completed
        const swapBridgeCompletedEvent = findEventByName(
          EventTypes.SwapBridgeCompleted,
        );
        if (swapBridgeCompletedEvent) {
          assert.ok(
            swapBridgeCompletedEvent.properties.action_type ===
              'crosschain-v1' &&
              swapBridgeCompletedEvent.properties.chain_id_source ===
                'eip155:1' &&
              swapBridgeCompletedEvent.properties.token_symbol_source ===
                'DAI' &&
              swapBridgeCompletedEvent.properties.token_address_source ===
                'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f' &&
              swapBridgeCompletedEvent.properties.chain_id_destination ===
                'eip155:59144' &&
              swapBridgeCompletedEvent.properties.token_symbol_destination ===
                'ETH' &&
              swapBridgeCompletedEvent.properties.token_address_destination ===
                'eip155:59144/slip44:60' &&
              swapBridgeCompletedEvent.properties.slippage_limit === 0 &&
              swapBridgeCompletedEvent.properties.custom_slippage === true &&
              swapBridgeCompletedEvent.properties.usd_amount_source === 25 &&
              swapBridgeCompletedEvent.properties.swap_type === 'crosschain' &&
              swapBridgeCompletedEvent.properties.is_hardware_wallet ===
                false &&
              swapBridgeCompletedEvent.properties.stx_enabled === true &&
              Array.isArray(
                swapBridgeCompletedEvent.properties.security_warnings,
              ) &&
              typeof swapBridgeCompletedEvent.properties.usd_quoted_gas ===
                'number' &&
              swapBridgeCompletedEvent.properties.gas_included === false &&
              swapBridgeCompletedEvent.properties.provider === 'lifi_across' &&
              typeof swapBridgeCompletedEvent.properties.quoted_time_minutes ===
                'number' &&
              typeof swapBridgeCompletedEvent.properties.usd_quoted_return ===
                'number' &&
              swapBridgeCompletedEvent.properties.approval_transaction ===
                'COMPLETE' &&
              swapBridgeCompletedEvent.properties.source_transaction ===
                'COMPLETE' &&
              swapBridgeCompletedEvent.properties.destination_transaction ===
                'COMPLETE' &&
              typeof swapBridgeCompletedEvent.properties.actual_time_minutes ===
                'number' &&
              typeof swapBridgeCompletedEvent.properties.usd_actual_return ===
                'number' &&
              typeof swapBridgeCompletedEvent.properties.usd_actual_gas ===
                'number' &&
              swapBridgeCompletedEvent.properties.quote_vs_execution_ratio ===
                1 &&
              swapBridgeCompletedEvent.properties.quoted_vs_used_gas_ratio ===
                1 &&
              swapBridgeCompletedEvent.properties.error_message ===
                'error_message' &&
              swapBridgeCompletedEvent.properties.price_impact === 0 &&
              swapBridgeCompletedEvent.properties.environmentType ===
                'background' &&
              typeof swapBridgeCompletedEvent.properties.actionId ===
                'string' &&
              swapBridgeCompletedEvent.properties.category ===
                'Unified SwapBridge' &&
              swapBridgeCompletedEvent.properties.locale === 'en' &&
              swapBridgeCompletedEvent.properties.chain_id === '0x1' &&
              swapBridgeCompletedEvent.properties.environment_type ===
                'background',
          );
        } else {
          assert.fail(`Could not find ${EventTypes.SwapBridgeCompleted} event`);
        }
      },
    );
  });
});
