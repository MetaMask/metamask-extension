/**
 * Shared Ethereum and Monad setup for max-amount parity E2E tests.
 *
 * Both the send and swap specs use the same account, native balance, and gas
 * mocks. There is no local chain: JSON-RPC, the gas API, accounts balances,
 * and tx-sentinel are served by Mockttp.
 */

import { strict as assert } from 'assert';
import { merge } from 'lodash';
import type { Mockttp } from 'mockttp';
import type { NetworkState } from '@metamask/network-controller';
import { GAS_API_BASE_URL } from '../../../../shared/constants/swaps';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  DEFAULT_FIXTURE_ACCOUNT_ID,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
} from '../../constants';
import { v6AccountsApiBalancesJson } from '../../helpers/accounts-api-v6-balances';
import { DEFAULT_BRIDGE_FEATURE_FLAGS } from '../bridge/constants';
import {
  AMOUNT_TOLERANCE,
  GAS_FEE_NATIVE,
  GAS_FEE_TOLERANCE,
  GAS_LIMIT_HEX,
  MAX_FEE_PER_GAS_HEX,
  NATIVE_BALANCE,
  NATIVE_BALANCE_HEX,
} from './max-amount-parity.constants';
import type { MaxAmountNetwork } from './max-amount-parity.constants';

const ONE_GWEI_HEX = '0x3b9aca00';

const SUGGESTED_GAS_FEES = {
  low: {
    suggestedMaxPriorityFeePerGas: '1',
    suggestedMaxFeePerGas: '2000',
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 30000,
  },
  medium: {
    suggestedMaxPriorityFeePerGas: '1',
    suggestedMaxFeePerGas: '2000',
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 45000,
  },
  high: {
    suggestedMaxPriorityFeePerGas: '1',
    suggestedMaxFeePerGas: '2000',
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 60000,
  },
  estimatedBaseFee: '1',
  networkCongestion: 0.1,
  latestPriorityFeeRange: ['1', '1'],
  historicalPriorityFeeRange: ['1', '1'],
  historicalBaseFeeRange: ['1', '1'],
  priorityFeeTrend: 'level',
  baseFeeTrend: 'level',
};

const LATEST_BLOCK = {
  number: '0x100',
  hash: `0x${'11'.repeat(32)}`,
  parentHash: `0x${'00'.repeat(32)}`,
  timestamp: '0x64',
  gasLimit: '0x1c9c380',
  gasUsed: '0x0',
  miner: `0x${'00'.repeat(20)}`,
  baseFeePerGas: ONE_GWEI_HEX,
  transactions: [],
};

type JsonRpcCall = {
  id?: unknown;
  method?: string;
};

/**
 * Builds the fixture for one network row: selected chain, seeded native
 * balance, and smart transactions / simulations turned off so max send uses
 * the mocked gas fields.
 *
 * @param network - Network row under test.
 * @returns Fixture state for `withFixtures`.
 */
export function buildMaxAmountParityFixture(network: MaxAmountNetwork) {
  const fixture = new FixtureBuilderV2()
    .withNetworkController({
      selectedNetworkClientId:
        network.networkClientId as NetworkState['selectedNetworkClientId'],
    })
    .withEnabledNetworks({
      eip155: {
        [network.chainId]: true,
      },
    })
    .withSmartTransactionsOptedOut()
    .withPreferencesControllerTxSimulationsDisabled()
    .withAssetsController({
      assetsInfo: {
        [network.assetId]: {
          aggregators: [],
          decimals: 18,
          image: '',
          name: network.name,
          symbol: network.symbol,
          type: 'native',
        },
      },
      assetsBalance: {
        [DEFAULT_FIXTURE_ACCOUNT_ID]: {
          [network.assetId]: { amount: NATIVE_BALANCE },
        },
      },
      assetsPrice: {
        [network.assetId]: {
          assetPriceType: 'fungible' as const,
          id: network.symbol.toLowerCase(),
          lastUpdated: 0,
          price: 1,
          usdPrice: 1,
        },
      },
    })
    .withAccountTracker({
      accountsByChainId: {
        [network.chainId]: {
          [DEFAULT_FIXTURE_ACCOUNT_LOWERCASE]: {
            balance: NATIVE_BALANCE_HEX,
          },
        },
      },
    })
    .build();

  merge(fixture.data.NetworkEnablementController, {
    nativeAssetIdentifiers: {
      [`eip155:${network.chainIdDecimal}`]: network.assetId,
    },
  });

  return fixture;
}

/**
 * `withFixtures` options shared by the send and swap specs.
 *
 * @param network - Network row under test.
 * @param title - Mocha test title, forwarded to the fixture server.
 * @param options - Extra options.
 * @param options.includeBridgeFlags - When true, enables swap on this chain.
 * @returns Options object for `withFixtures`.
 */
export function getMaxAmountParityFixtures(
  network: MaxAmountNetwork,
  title: string | undefined,
  { includeBridgeFlags = false }: { includeBridgeFlags?: boolean } = {},
) {
  return {
    fixtures: buildMaxAmountParityFixture(network),
    localNodeOptions: 'none' as const,
    title,
    testSpecificMock: async (mockServer: Mockttp) => {
      await mockMaxAmountParityApis(mockServer, network, {
        includeBridgeMocks: includeBridgeFlags,
      });
    },
    ...(includeBridgeFlags
      ? {
          manifestFlags: {
            remoteFeatureFlags: {
              bridgeConfig: DEFAULT_BRIDGE_FEATURE_FLAGS,
            },
          },
        }
      : {}),
  };
}

/**
 * Swap Max after the chain reserve is applied.
 * Ethereum keeps the full balance. Monad keeps 10 MON back.
 *
 * @param network - Network row under test.
 * @returns Expected Swap Max in human units.
 */
export function expectedSwapMax(network: MaxAmountNetwork): number {
  return Number(NATIVE_BALANCE) - Number(network.swapReserve);
}

/**
 * Parses a displayed token amount. Accepts a bare number, a tooltip title, or
 * heading text such as `24 MON`.
 *
 * @param value - Raw UI text.
 * @returns The numeric amount.
 */
export function parseDisplayedAmount(value: string): number {
  const match = value.replace(/,/gu, '').match(/-?\d+(?:\.\d+)?/u);
  if (!match) {
    throw new Error(`Could not parse amount from "${value}"`);
  }
  return Number(match[0]);
}

/**
 * Asserts the send-page Max equals the seeded balance and that the
 * confirmation amount is that balance minus the mocked gas fee.
 *
 * @param sendMax - Amount captured from the send amount input.
 * @param confirmationAmount - Amount captured from the confirmation heading.
 */
export function assertSendMaxParity(
  sendMax: string,
  confirmationAmount: string,
): void {
  const sendAmount = parseDisplayedAmount(sendMax);
  const confirmedAmount = parseDisplayedAmount(confirmationAmount);
  assert.ok(
    Math.abs(sendAmount - Number(NATIVE_BALANCE)) < AMOUNT_TOLERANCE,
    `Send max should equal the seeded balance of ${NATIVE_BALANCE}. Actual: ${sendMax}`,
  );

  const difference = sendAmount - confirmedAmount;
  assert.ok(
    Math.abs(difference - GAS_FEE_NATIVE) < GAS_FEE_TOLERANCE,
    `Send max and confirmation differ by ${difference}, expected the mocked gas fee of ${GAS_FEE_NATIVE}. Send: ${sendMax}, confirmation: ${confirmationAmount}`,
  );
}

/**
 * Asserts a captured amount matches an expected human value.
 *
 * @param actual - Raw UI text.
 * @param expected - Expected human amount.
 * @param message - Assertion context included when the values differ.
 */
export function assertAmountEquals(
  actual: string,
  expected: number,
  message: string,
): void {
  const parsed = parseDisplayedAmount(actual);
  assert.ok(
    Math.abs(parsed - expected) < AMOUNT_TOLERANCE,
    `${message}. Actual: ${actual} (${parsed}), expected: ${expected}`,
  );
}

/**
 * Mocks the accounts API, gas API, Infura JSON-RPC, spot price, and
 * tx-sentinel flags for one network row.
 *
 * @param mockServer - Mockttp server for this test.
 * @param network - Network row under test.
 * @param options - Extra mocks.
 * @param options.includeBridgeMocks - When true, stub swap token search and quotes.
 */
export async function mockMaxAmountParityApis(
  mockServer: Mockttp,
  network: MaxAmountNetwork,
  { includeBridgeMocks = false }: { includeBridgeMocks?: boolean } = {},
): Promise<void> {
  await mockInfuraRpc(mockServer, network);
  await mockGasApi(mockServer, network);
  await mockAccountsApi(mockServer, network);
  await mockSpotPrice(mockServer, network);
  await mockSentinelNetwork(mockServer, network);
  if (includeBridgeMocks) {
    await mockBridgeApis(mockServer);
  }
}

async function mockInfuraRpc(
  mockServer: Mockttp,
  network: MaxAmountNetwork,
): Promise<void> {
  const host = network.infuraHost.replace(/\./gu, '\\.');
  await mockServer
    .forPost(new RegExp(`https://${host}/v3/`, 'u'))
    .always()
    .thenCallback(async (request) => {
      const { calls, batched } = await readRpcCalls(request);
      const responses = calls.map((call) => ({
        jsonrpc: '2.0',
        id: call.id ?? 1,
        result: rpcResult(call.method, network),
      }));
      return {
        statusCode: 200,
        json: batched
          ? responses
          : (responses[0] ?? { jsonrpc: '2.0', id: 1, result: '0x' }),
      };
    });
}

async function mockGasApi(
  mockServer: Mockttp,
  network: MaxAmountNetwork,
): Promise<void> {
  await mockServer
    .forGet(
      `${GAS_API_BASE_URL}/networks/${network.chainIdDecimal}/suggestedGasFees`,
    )
    .always()
    .thenJson(200, SUGGESTED_GAS_FEES);
  await mockServer
    .forGet(`${GAS_API_BASE_URL}/networks/${network.chainIdDecimal}/gasPrices`)
    .always()
    .thenJson(200, {
      SafeGasPrice: '2000',
      ProposeGasPrice: '2000',
      FastGasPrice: '2000',
    });
}

async function mockAccountsApi(
  mockServer: Mockttp,
  network: MaxAmountNetwork,
): Promise<void> {
  const balancesFor = (accountId: string) => {
    const chainRef = accountId.split(':')[1];
    if (chainRef !== String(network.chainIdDecimal)) {
      return [];
    }
    return [
      {
        accountId,
        assetId: network.assetId,
        balance: NATIVE_BALANCE,
      },
    ];
  };

  await mockServer
    .forGet('https://accounts.api.cx.metamask.io/v2/supportedNetworks')
    .always()
    .thenJson(200, {
      fullSupport: [`eip155:${network.chainIdDecimal}`],
      partialSupport: [],
    });

  await mockServer
    .forGet('https://accounts.api.cx.metamask.io/v5/multiaccount/balances')
    .always()
    .thenCallback((request) => {
      const balances = accountIdsFrom(request.url).flatMap(balancesFor);
      return {
        statusCode: 200,
        json: {
          count: balances.length,
          unprocessedNetworks: [],
          balances,
        },
      };
    });

  await mockServer
    .forGet('https://accounts.api.cx.metamask.io/v6/multiaccount/balances')
    .always()
    .thenCallback((request) => ({
      statusCode: 200,
      json: v6AccountsApiBalancesJson(
        request.url,
        accountIdsFrom(request.url).flatMap(balancesFor),
      ),
    }));
}

async function mockSpotPrice(
  mockServer: Mockttp,
  network: MaxAmountNetwork,
): Promise<void> {
  await mockServer
    .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
    .always()
    .thenCallback((request) => {
      const assetIds = new URL(request.url).searchParams.get('assetIds') ?? '';
      const json: Record<string, unknown> = {};
      if (assetIds.includes(network.assetId)) {
        json[network.assetId] = {
          id: network.symbol.toLowerCase(),
          price: 1,
          currency: 'usd',
          pricePercentChange1d: 0,
        };
      }
      return { statusCode: 200, json };
    });
}

/**
 * Swap opens the bridge token picker and may request a quote after Max.
 * Empty JSON bodies from the catch-all mock surface as page errors.
 *
 * @param mockServer - Mockttp server for this test.
 */
async function mockBridgeApis(mockServer: Mockttp): Promise<void> {
  await mockServer
    .forPost(/https:\/\/bridge\.dev-api\.cx\.metamask\.io\/getTokens\/popular/u)
    .always()
    .thenJson(200, []);
  await mockServer
    .forPost(/https:\/\/bridge\.dev-api\.cx\.metamask\.io\/getTokens\/search/u)
    .always()
    .thenJson(200, {
      data: [],
      pageInfo: { hasNextPage: false },
    });
  await mockServer
    .forGet(/https:\/\/bridge\.dev-api\.cx\.metamask\.io\/getQuoteStream/u)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      headers: { 'content-type': 'text/event-stream' },
      body: 'event: complete\nid: 0\ndata: {"quoteCount":0,"hasQuotes":false}\n\n',
    }));
}

async function mockSentinelNetwork(
  mockServer: Mockttp,
  network: MaxAmountNetwork,
): Promise<void> {
  const flags = {
    chainID: network.chainIdDecimal,
    confirmations: true,
    network: network.sentinelNetwork,
    relayTransactions: false,
    sendBundle: false,
    // Native Swap Max is hidden unless simulation fees are supported.
    simulationIncludeFees: true,
    smartTransactions: false,
  };

  await mockServer
    .forGet(/https:\/\/tx-sentinel-[\w-]+\.api\.cx\.metamask\.io\/network$/u)
    .always()
    .thenJson(200, flags);
  await mockServer
    .forGet(/https:\/\/tx-sentinel-[\w-]+\.api\.cx\.metamask\.io\/networks$/u)
    .always()
    .thenJson(200, { [String(network.chainIdDecimal)]: flags });
}

function rpcResult(
  method: string | undefined,
  network: MaxAmountNetwork,
): unknown {
  switch (method) {
    case 'eth_chainId':
      return network.chainId;
    case 'net_version':
      return String(network.chainIdDecimal);
    case 'eth_blockNumber':
      return LATEST_BLOCK.number;
    case 'eth_getBalance':
      return NATIVE_BALANCE_HEX;
    case 'eth_getTransactionCount':
      return '0x1';
    case 'eth_estimateGas':
      return GAS_LIMIT_HEX;
    case 'eth_gasPrice':
      return MAX_FEE_PER_GAS_HEX;
    case 'eth_maxPriorityFeePerGas':
      return ONE_GWEI_HEX;
    case 'eth_feeHistory':
      return {
        baseFeePerGas: [ONE_GWEI_HEX, ONE_GWEI_HEX],
        gasUsedRatio: [0.1],
        oldestBlock: '0xff',
        reward: [[ONE_GWEI_HEX]],
      };
    case 'eth_getBlockByNumber':
    case 'eth_getBlockByHash':
      return LATEST_BLOCK;
    case 'eth_getCode':
    case 'eth_call':
      return '0x';
    case 'eth_getLogs':
      return [];
    case 'eth_syncing':
      return false;
    case 'net_listening':
      return true;
    case 'eth_getTransactionReceipt':
    case 'eth_getTransactionByHash':
      return null;
    default:
      return '0x';
  }
}

async function readRpcCalls(request: {
  body: { getJson: () => Promise<unknown> };
}): Promise<{ calls: JsonRpcCall[]; batched: boolean }> {
  try {
    const body = await request.body.getJson();
    if (Array.isArray(body)) {
      return { calls: body as JsonRpcCall[], batched: true };
    }
    if (body && typeof body === 'object') {
      return { calls: [body as JsonRpcCall], batched: false };
    }
  } catch {
    // A body that is not JSON-RPC is treated as no calls.
  }
  return { calls: [], batched: false };
}

function accountIdsFrom(requestUrl: string): string[] {
  const requested = (new URL(requestUrl).searchParams.get('accountIds') ?? '')
    .split(',')
    .map((accountId) => accountId.trim())
    .filter(Boolean);
  if (requested.length > 0) {
    return requested;
  }
  return [`eip155:1:${DEFAULT_FIXTURE_ACCOUNT_LOWERCASE}`];
}
