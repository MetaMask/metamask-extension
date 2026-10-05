import type { Hex, Json } from '@metamask/utils';
import type { Mockttp } from 'mockttp';
import { encodeFunctionData, keccak256, pad, toHex } from 'viem';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  ACCOUNT_2,
  DEFAULT_FIXTURE_ACCOUNT_ID,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  NETWORK_CLIENT_ID,
} from '../../constants';
import { getProductionRemoteFlagApiResponse } from '../../feature-flags/feature-flag-registry';
import type { Anvil } from '../../seeder/anvil';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { TX_SENTINEL_URL } from '../../../../shared/constants/transaction';
import {
  ACCOUNT_2_FIXTURE_ID,
  ANVIL_USDC_BALANCES_SLOT,
  DEFAULT_FIXTURE_ETH_NATIVE_ASSET_IDS,
  ERC20_ABI,
  ERC20_ALLOWANCE_SELECTOR,
  ERC20_BALANCE_OF_SELECTOR,
  ERC20_DECIMALS_SELECTOR,
  ERC20_TRANSFER_EVENT_TOPIC,
  ETH_BALANCE_HUMAN,
  ETH_USD_PRICE,
  GAS_API_BASE_URL,
  MAINNET_NATIVE_ASSET_ID,
  MAINNET_USDC_ADDRESS,
  MAINNET_USDC_ASSET_ID,
  MAINNET_USDC_ASSET_ID_LOWERCASE,
  MON_USD_PRICE,
  MONAD_BLOCK_HASH,
  MONAD_BLOCK_NUMBER,
  MONAD_CHAIN_ID_DECIMAL,
  MONAD_NATIVE_ASSET_ID,
  MONAD_SETTLEMENT_HASH,
  MONAD_TX_SENTINEL_URL,
  MONEY_ACCOUNT_ADDRESS,
  MONEY_ACCOUNT_DELEGATED_CODE,
  MONEY_ACCOUNT_DEPOSIT_REMOTE_FLAGS,
  MULTICALL3_AGGREGATE3_SELECTOR,
  MUSD_MONAD_ADDRESS,
  MUSD_MONAD_ASSET_ID,
  MUSD_USD_PRICE,
  NATIVE_TOKEN_ADDRESS,
  PRICE_API_BASE_URL,
  RELAY_API_BASE_URL,
  RELAY_SOLVER_ADDRESS,
  SENTINEL_RELAY_UUID,
  SUGGESTED_GAS_FEES,
  UINT256_MAX,
  UINT256_ZERO,
  UINT8_SIX,
  USD_PRICE_BY_ASSET_ID,
  USDC_BALANCE_HUMAN,
  USDC_BALANCE_RAW,
  USDC_USD_PRICE,
} from './constants';

/**
 * Fungible price entry whose `assetPriceType` stays a literal.
 * `Object.fromEntries` otherwise widens it to `string`, which is not an
 * `AssetPrice` under assets-controller 17.
 *
 * @param id - CoinGecko id stored on the price entry.
 * @param usdPrice - USD price seeded for the asset.
 */
function fungibleAssetPrice(id: string, usdPrice: number) {
  return {
    assetPriceType: 'fungible' as const,
    id,
    lastUpdated: 0,
    price: usdPrice,
    usdPrice,
  };
}

const DEFAULT_FIXTURE_ETH_NATIVE_PRICES = Object.fromEntries(
  DEFAULT_FIXTURE_ETH_NATIVE_ASSET_IDS.map((assetId) => [
    assetId,
    fungibleAssetPrice('ethereum', ETH_USD_PRICE),
  ]),
) as {
  [AssetId in (typeof DEFAULT_FIXTURE_ETH_NATIVE_ASSET_IDS)[number]]: ReturnType<
    typeof fungibleAssetPrice
  >;
};

type RelayQuoteRequestBody = {
  amount?: string;
  originCurrency?: string;
  recipient?: string;
  user?: string;
};

function getProductionRemoteFlagApiResponseWithOverrides(
  overrides: Record<string, Json>,
): Json[] {
  const overrideNames = new Set(Object.keys(overrides));

  return [
    ...getProductionRemoteFlagApiResponse().filter(
      (entry) =>
        !Object.keys(entry as Record<string, Json>).some((name) =>
          overrideNames.has(name),
        ),
    ),
    ...Object.entries(overrides).map(([name, value]) => ({ [name]: value })),
  ];
}

/**
 * Serves the production remote flags plus the Money Account deposit overrides.
 * Seeding `RemoteFeatureFlagController` state alone is not enough: the
 * background controller refetches /v1/flags on load and would overwrite the
 * seeded flags with the mocked production defaults.
 *
 * @param server - Mockttp server.
 * @param overrides - Extra remote flag overrides merged into the response.
 */
async function mockMoneyAccountDepositFlags(
  server: Mockttp,
  overrides: Record<string, Json> = {},
): Promise<void> {
  const flags = getProductionRemoteFlagApiResponseWithOverrides({
    ...MONEY_ACCOUNT_DEPOSIT_REMOTE_FLAGS,
    ...overrides,
  });
  await server
    .forGet('https://client-config.api.cx.metamask.io/v1/flags')
    .withQuery({ client: 'extension', distribution: 'main' })
    .always()
    .thenCallback(() => ({
      ok: true,
      statusCode: 200,
      json: flags,
    }));
}

async function mockPriceApis(server: Mockttp): Promise<void> {
  await server
    .forGet(`${PRICE_API_BASE_URL}/v1/exchange-rates`)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        eth: {
          name: 'Ether',
          ticker: 'eth',
          value: 1 / ETH_USD_PRICE,
          currencyType: 'crypto',
        },
        usd: {
          name: 'US Dollar',
          ticker: 'usd',
          value: 1,
          currencyType: 'fiat',
        },
      },
    }));

  await server
    .forGet(`${PRICE_API_BASE_URL}/v3/spot-prices`)
    .always()
    .thenCallback((request) => {
      const url = new URL(request.url);
      const vsCurrency =
        url.searchParams.get('vsCurrency')?.toLowerCase() ?? 'usd';
      const includeMarketData =
        url.searchParams.get('includeMarketData') === 'true';
      const assetIds = url.searchParams
        .getAll('assetIds')
        .flatMap((value) => value.split(','))
        .filter(Boolean);
      const prices = Object.fromEntries(
        assetIds.flatMap((assetId) => {
          const price = USD_PRICE_BY_ASSET_ID[assetId.toLowerCase()];
          if (price === undefined) {
            return [];
          }
          return [
            [
              assetId,
              includeMarketData
                ? {
                    assetPriceType: 'fungible',
                    id: assetId,
                    price,
                    pricePercentChange1d: 0,
                  }
                : { [vsCurrency]: price },
            ],
          ];
        }),
      );
      return { statusCode: 200, json: prices };
    });
}

async function mockGasApis(server: Mockttp): Promise<void> {
  await server
    .forGet(`${GAS_API_BASE_URL}/v1/supportedNetworks`)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: [CHAIN_IDS.MAINNET, CHAIN_IDS.MONAD],
    }));

  for (const chainIdDecimal of [1, MONAD_CHAIN_ID_DECIMAL]) {
    await server
      .forGet(`${GAS_API_BASE_URL}/networks/${chainIdDecimal}/suggestedGasFees`)
      .always()
      .thenCallback(() => ({ statusCode: 200, json: SUGGESTED_GAS_FEES }));
  }
}

/**
 * Multicall3 `aggregate3` returns `tuple(bool success, bytes returnData)[]`.
 * A flat 32-byte zero cannot be decoded, so encode the array for the exact
 * number of sub-calls read from the request calldata, each with empty data.
 *
 * @param callData - The `aggregate3` calldata.
 * @returns ABI-encoded result.
 */
function encodeAggregate3Result(callData: string): Hex {
  const count = parseInt(callData.slice(74, 138), 16) || 0;
  let result =
    '0000000000000000000000000000000000000000000000000000000000000020';
  result += count.toString(16).padStart(64, '0');
  for (let i = 0; i < count; i++) {
    const offset = count * 32 + i * 128;
    result += offset.toString(16).padStart(64, '0');
  }
  for (let i = 0; i < count; i++) {
    result +=
      '0000000000000000000000000000000000000000000000000000000000000001';
    result +=
      '0000000000000000000000000000000000000000000000000000000000000040';
    result +=
      '0000000000000000000000000000000000000000000000000000000000000020';
    result +=
      '0000000000000000000000000000000000000000000000000000000000000000';
  }
  return `0x${result}`;
}

function buildMonadBlock(): Record<string, unknown> {
  return {
    number: MONAD_BLOCK_NUMBER,
    hash: MONAD_BLOCK_HASH,
    parentHash: MONAD_BLOCK_HASH,
    baseFeePerGas: '0x3b9aca00',
    gasLimit: '0x1c9c380',
    gasUsed: '0x94670',
    timestamp: toHex(Math.floor(Date.now() / 1000)),
    transactions: [],
    miner: NATIVE_TOKEN_ADDRESS,
    difficulty: '0x0',
    extraData: '0x',
    nonce: '0x0000000000000000',
    logsBloom: `0x${'0'.repeat(512)}`,
    size: '0x0',
    stateRoot: MONAD_BLOCK_HASH,
    receiptsRoot: MONAD_BLOCK_HASH,
    transactionsRoot: MONAD_BLOCK_HASH,
    sha3Uncles: MONAD_BLOCK_HASH,
    totalDifficulty: '0x0',
    uncles: [],
  };
}

/**
 * Bookkeeping shared between the Relay quote mock and the settlement mocks so
 * each confirmed deposit settles for exactly the amount its own quote promised
 * (quotes for other amounts can still be served concurrently, e.g. the
 * deposit prefill racing a percentage click).
 */
type RelaySettlements = {
  /** Raw mUSD output keyed by lowercase Monad settlement tx hash. */
  amountByHash: Map<string, bigint>;
  /** Monad settlement tx hash keyed by lowercase Relay request id. */
  hashByRequestId: Map<string, Hex>;
  /** Fallback for receipts of hashes no quote produced (the vault batch). */
  lastAmountOutRaw: bigint;
};

function createRelaySettlements(): RelaySettlements {
  return {
    amountByHash: new Map(),
    hashByRequestId: new Map(),
    lastAmountOutRaw: 0n,
  };
}

/**
 * Canned Monad JSON-RPC responses. Non-atomic deposits resolve the settled
 * amount from the mUSD Transfer log in the settlement receipt
 * (`getTransferredAmountFromTxHash`), so the receipt for a quote's settlement
 * hash reports a transfer of that quote's output to the Money Account.
 *
 * @param body - JSON-RPC request body.
 * @param settlements - Quote → settlement bookkeeping.
 * @returns JSON-RPC result.
 */
function resolveMonadRpcResult(
  body: Record<string, unknown>,
  settlements: RelaySettlements,
): unknown {
  const method = body?.method as string;
  const params = (body?.params as unknown[] | undefined) ?? [];

  switch (method) {
    case 'eth_chainId':
      return CHAIN_IDS.MONAD;
    case 'eth_blockNumber':
      return MONAD_BLOCK_NUMBER;
    case 'eth_getBlockByNumber':
    case 'eth_getBlockByHash':
      return buildMonadBlock();
    case 'eth_getTransactionReceipt': {
      const requestedHash = (params[0] as Hex) ?? MONAD_SETTLEMENT_HASH;
      const settledAmountRaw =
        settlements.amountByHash.get(requestedHash.toLowerCase()) ??
        settlements.lastAmountOutRaw;
      return {
        transactionHash: requestedHash,
        transactionIndex: '0x0',
        blockNumber: MONAD_BLOCK_NUMBER,
        blockHash: MONAD_BLOCK_HASH,
        from: NATIVE_TOKEN_ADDRESS,
        to: MUSD_MONAD_ADDRESS,
        cumulativeGasUsed: '0x94670',
        gasUsed: '0x94670',
        effectiveGasPrice: '0x3b9aca00',
        contractAddress: null,
        logs: [
          {
            address: MUSD_MONAD_ADDRESS,
            topics: [
              ERC20_TRANSFER_EVENT_TOPIC,
              pad(NATIVE_TOKEN_ADDRESS, { size: 32 }),
              pad(MONEY_ACCOUNT_ADDRESS, { size: 32 }),
            ],
            data: pad(toHex(settledAmountRaw), { size: 32 }),
            blockNumber: MONAD_BLOCK_NUMBER,
            blockHash: MONAD_BLOCK_HASH,
            transactionHash: requestedHash,
            transactionIndex: '0x0',
            logIndex: '0x0',
            removed: false,
          },
        ],
        status: '0x1',
        logsBloom: `0x${'0'.repeat(512)}`,
      };
    }
    case 'eth_getTransactionByHash': {
      const requestedHash = (params[0] as Hex) ?? MONAD_SETTLEMENT_HASH;
      return {
        hash: requestedHash,
        blockHash: MONAD_BLOCK_HASH,
        blockNumber: MONAD_BLOCK_NUMBER,
        from: NATIVE_TOKEN_ADDRESS,
        to: MUSD_MONAD_ADDRESS,
        gas: '0x94670',
        gasPrice: '0x3b9aca00',
        input: '0x',
        nonce: '0x0',
        transactionIndex: '0x0',
        value: '0x0',
        type: '0x2',
        chainId: CHAIN_IDS.MONAD,
        v: '0x0',
        r: '0x0',
        s: '0x0',
      };
    }
    case 'eth_sendRawTransaction':
    case 'eth_sendTransaction':
      return MONAD_SETTLEMENT_HASH;
    case 'eth_call': {
      const data = String(
        (params[0] as Record<string, string> | undefined)?.data ?? '',
      );
      const selector = data.slice(0, 10);
      switch (selector) {
        case ERC20_ALLOWANCE_SELECTOR:
          return UINT256_MAX;
        case ERC20_DECIMALS_SELECTOR:
          return UINT8_SIX;
        case MULTICALL3_AGGREGATE3_SELECTOR:
          return encodeAggregate3Result(data);
        default:
          return UINT256_ZERO;
      }
    }
    case 'eth_getTransactionCount':
      return '0x0';
    case 'eth_gasPrice':
    case 'eth_maxPriorityFeePerGas':
      return '0x3b9aca00';
    case 'eth_estimateGas':
      return '0x30d40';
    case 'eth_feeHistory':
      return {
        oldestBlock: MONAD_BLOCK_NUMBER,
        baseFeePerGas: ['0x3b9aca00', '0x3b9aca00'],
        gasUsedRatio: [0.5],
        reward: [['0x3b9aca00', '0x3b9aca00', '0x3b9aca00']],
      };
    case 'eth_getBalance':
      return '0x0';
    case 'eth_getCode': {
      // The Money Account is reported as already delegated to the production
      // EIP-7702 contract on Monad, so neither the upgrade pipeline nor the
      // vault deposit batch tries to upgrade it first.
      const address = String(params[0] ?? '').toLowerCase();
      return address === MONEY_ACCOUNT_ADDRESS
        ? MONEY_ACCOUNT_DELEGATED_CODE
        : '0x';
    }
    case 'eth_getLogs':
      return [];
    default:
      return '0x';
  }
}

/**
 * Sentinel JSON-RPC handler shared by the Mainnet and Monad hosts: relay
 * submissions return a UUID and simulations succeed with empty state diffs.
 *
 * @param body - JSON-RPC request body.
 * @returns JSON-RPC response body.
 */
function resolveSentinelRpcResponse(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const id = body?.id ?? 1;

  if (body?.method === 'eth_sendRelayTransaction') {
    return { jsonrpc: '2.0', id, result: { uuid: SENTINEL_RELAY_UUID } };
  }

  if (body?.method === 'infura_simulateTransactions') {
    const params = body.params as Record<string, unknown>[] | undefined;
    const transactions = (params?.[0]?.transactions as
      | Record<string, string>[]
      | undefined) ?? [{}];
    return {
      jsonrpc: '2.0',
      id,
      result: {
        transactions: transactions.map((tx) => ({
          return: '0x',
          status: '0x1',
          gasUsed: '0x5de2',
          gasLimit: '0x493e0',
          fees: [],
          stateDiff: {},
          callTrace: {
            from: tx.from ?? '0x',
            to: tx.to ?? '0x',
            type: 'CALL',
            gas: '0x493e0',
            gasUsed: '0x5de2',
            value: tx.value ?? '0x0',
            input: tx.data ?? '0x',
            output: '0x',
            error: '',
            calls: null,
          },
          feeEstimate: 0,
          baseFeePerGas: 0,
        })),
        blockNumber: MONAD_BLOCK_NUMBER,
        id: 'money-account-deposit-e2e-simulation',
      },
    };
  }

  return { jsonrpc: '2.0', id, result: null };
}

/**
 * Answers Mainnet USDC `balanceOf` with the funded accounts' raw balance.
 *
 * Pay refreshes the payment-token snapshot with an Infura `eth_call` after
 * the amount is committed. Leaving that call to Anvil races the human-amount
 * snapshot: when the refresh loses, confirm stays on a $0.0001 balance.
 *
 * @param server - Mockttp server.
 */
async function mockMainnetUsdcBalance(server: Mockttp): Promise<void> {
  const fundedAccounts = new Set([
    DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
    ACCOUNT_2.toLowerCase(),
  ]);

  await server
    .forPost(/mainnet\.infura\.io/u)
    .always()
    .matching(async (request) => {
      const body = (await request.body.getJson()) as Record<string, unknown>;
      return isMainnetUsdcBalanceOf(body);
    })
    .thenCallback(async (request) => {
      const body = (await request.body.getJson()) as Record<string, unknown>;
      const data = String(
        (body.params as { data?: string }[] | undefined)?.[0]?.data ?? '',
      );
      // balanceOf(address): selector + 12 bytes of padding + the address.
      const account = `0x${data.slice(34, 74)}`.toLowerCase();
      const balance = fundedAccounts.has(account) ? USDC_BALANCE_RAW : 0n;
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: body.id ?? 1,
          result: pad(toHex(balance), { size: 32 }),
        },
      };
    });
}

/**
 * @param body - JSON-RPC request body.
 * @returns Whether this is a Mainnet USDC `balanceOf` eth_call.
 */
function isMainnetUsdcBalanceOf(body: Record<string, unknown>): boolean {
  if (body?.method !== 'eth_call') {
    return false;
  }
  const tx = (body.params as { to?: string; data?: string }[] | undefined)?.[0];
  const to = String(tx?.to ?? '').toLowerCase();
  const data = String(tx?.data ?? '').toLowerCase();
  return (
    to === MAINNET_USDC_ADDRESS.toLowerCase() &&
    data.startsWith(ERC20_BALANCE_OF_SELECTOR)
  );
}

/**
 * Registers every network mock the deposit needs after Confirm:
 *
 * 1. Source leg on Mainnet is mined by Anvil (no mock).
 * 2. Relay status reports success with the Monad settlement hash.
 * 3. Monad RPC serves the settlement receipt carrying the mUSD Transfer to the
 * Money Account, plus the canned reads the vault deposit batch needs.
 * 4. The sponsored Monad vault batch is relayed through tx-sentinel, which
 * reports it validated with the same settlement hash.
 *
 * @param server - Mockttp server.
 * @param settlements - Quote → settlement bookkeeping filled by the quote mock.
 */
async function mockDepositSettlement(
  server: Mockttp,
  settlements: RelaySettlements,
): Promise<void> {
  const settlementHashForRequest = (url: string): Hex => {
    const requestId = new URL(url).searchParams.get('requestId') ?? '';
    return (
      settlements.hashByRequestId.get(requestId.toLowerCase()) ??
      MONAD_SETTLEMENT_HASH
    );
  };

  await server
    .forPost(/monad-mainnet\.infura\.io/u)
    .always()
    .thenCallback(async (request) => {
      const body = (await request.body.getJson()) as
        | Record<string, unknown>
        | Record<string, unknown>[];
      const resolve = (single: Record<string, unknown>) => ({
        id: single?.id ?? 1,
        jsonrpc: '2.0',
        result: resolveMonadRpcResult(single, settlements),
      });
      return {
        statusCode: 200,
        json: Array.isArray(body) ? body.map(resolve) : resolve(body),
      };
    });

  await server
    .forGet(`${TX_SENTINEL_URL}/networks`)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        '1': {
          name: 'Mainnet',
          group: 'ethereum',
          chainID: 1,
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          network: 'ethereum-mainnet',
          explorer: 'https://etherscan.io',
          confirmations: true,
          smartTransactions: false,
          relayTransactions: false,
          hidden: false,
          sendBundle: false,
        },
        [String(MONAD_CHAIN_ID_DECIMAL)]: {
          name: 'Monad Mainnet',
          group: 'monad',
          chainID: MONAD_CHAIN_ID_DECIMAL,
          nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
          network: 'monad-mainnet',
          explorer: 'https://monadscan.com/',
          confirmations: true,
          smartTransactions: false,
          relayTransactions: true,
          hidden: false,
          sendBundle: false,
        },
      },
    }));

  for (const sentinelUrl of [TX_SENTINEL_URL, MONAD_TX_SENTINEL_URL]) {
    await server
      .forPost(new RegExp(`^${sentinelUrl.replace(/\./gu, '\\.')}/?$`, 'u'))
      .always()
      .thenCallback(async (request) => {
        const body = (await request.body.getJson()) as Record<string, unknown>;
        return { statusCode: 200, json: resolveSentinelRpcResponse(body) };
      });
  }

  await server
    .forGet(
      `${MONAD_TX_SENTINEL_URL}/smart-transactions/${SENTINEL_RELAY_UUID}`,
    )
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        transactions: [{ hash: MONAD_SETTLEMENT_HASH, status: 'VALIDATED' }],
      },
    }));

  for (const statusUrl of [
    `${RELAY_API_BASE_URL}/intents/status/v3`,
    `${RELAY_API_BASE_URL}/intents/status`,
  ]) {
    await server
      .forGet(statusUrl)
      .always()
      .thenCallback((request) => {
        const settlementHash = settlementHashForRequest(request.url);
        return {
          statusCode: 200,
          json: {
            status: 'success',
            inTxHashes: [settlementHash],
            txHashes: [settlementHash],
            originChainId: 1,
            destinationChainId: MONAD_CHAIN_ID_DECIMAL,
            updatedAt: Date.now(),
          },
        };
      });
  }
  await server
    .forGet(/intents\.(uat-)?api\.cx\.metamask\.io\/relay\/intents\/status/u)
    .always()
    .thenCallback((request) => {
      const settlementHash = settlementHashForRequest(request.url);
      return {
        statusCode: 200,
        json: {
          status: 'success',
          inTxHashes: [settlementHash],
          txHashes: [settlementHash],
        },
      };
    });
}

function buildRelayCurrency(
  chainId: number,
  address: Hex,
  symbol: string,
  decimals: number,
) {
  return {
    chainId,
    address,
    symbol,
    name: symbol,
    decimals,
    metadata: { logoURI: '', verified: true },
  };
}

function formatRawAmount(amountRaw: bigint, decimals: number): string {
  const base = 10n ** BigInt(decimals);
  const whole = amountRaw / base;
  const fraction = (amountRaw % base)
    .toString()
    .padStart(decimals, '0')
    .replace(/0+$/u, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

/**
 * Builds a Relay quote for `originCurrency` → Monad mUSD at the mocked USD
 * prices. The single "deposit" step is a real Mainnet transaction (an ERC-20
 * transfer or native send to the Relay solver) that Anvil mines, so the
 * source leg confirms on-chain exactly as it would against Relay.
 *
 * @param body - Relay `/quote` request body.
 * @returns The quote payload and the raw mUSD output it promises.
 */
function buildRelayQuote(body: RelayQuoteRequestBody): {
  quote: Record<string, unknown>;
  amountOutRaw: bigint;
  requestId: Hex;
  settlementHash: Hex;
} {
  const isNativeSource =
    (body.originCurrency ?? '').toLowerCase() === NATIVE_TOKEN_ADDRESS;
  const sourceDecimals = isNativeSource ? 18 : 6;
  const sourcePrice = isNativeSource ? ETH_USD_PRICE : USDC_USD_PRICE;
  const sourceAddress: Hex = isNativeSource
    ? NATIVE_TOKEN_ADDRESS
    : MAINNET_USDC_ADDRESS;
  const sourceSymbol = isNativeSource ? 'ETH' : 'USDC';
  const user = (body.user ?? DEFAULT_FIXTURE_ACCOUNT_LOWERCASE) as Hex;
  const recipient = (body.recipient ?? MONEY_ACCOUNT_ADDRESS) as Hex;

  let amountInRaw = 0n;
  try {
    amountInRaw = BigInt(body.amount ?? '0');
  } catch {
    amountInRaw = 0n;
  }
  // amountUsd = amountIn / 10^sourceDecimals * price, kept in raw mUSD (6dp).
  const amountOutRaw =
    (amountInRaw * BigInt(sourcePrice) * 10n ** 6n) /
    10n ** BigInt(sourceDecimals);
  const amountUsd = formatRawAmount(amountOutRaw, 6);
  // One request id (and Monad settlement hash) per quoted output, so the
  // status and receipt mocks can answer for the quote that was confirmed.
  const requestId = keccak256(pad(toHex(amountOutRaw), { size: 32 }));
  const settlementHash = keccak256(requestId);

  const currencyIn = {
    currency: buildRelayCurrency(
      1,
      sourceAddress,
      sourceSymbol,
      sourceDecimals,
    ),
    amount: amountInRaw.toString(),
    amountFormatted: formatRawAmount(amountInRaw, sourceDecimals),
    amountUsd,
    minimumAmount: amountInRaw.toString(),
  };
  const currencyOut = {
    currency: buildRelayCurrency(
      MONAD_CHAIN_ID_DECIMAL,
      MUSD_MONAD_ADDRESS,
      'mUSD',
      6,
    ),
    amount: amountOutRaw.toString(),
    amountFormatted: amountUsd,
    amountUsd,
    minimumAmount: amountOutRaw.toString(),
  };
  const zeroFee = {
    currency: buildRelayCurrency(1, NATIVE_TOKEN_ADDRESS, 'ETH', 18),
    amount: '0',
    amountFormatted: '0.0',
    amountUsd: '0',
    minimumAmount: '0',
  };
  const stepData = isNativeSource
    ? {
        from: user,
        to: RELAY_SOLVER_ADDRESS,
        data: '0x',
        value: amountInRaw.toString(),
        chainId: 1,
        gas: '21000',
        maxFeePerGas: '3000000000',
        maxPriorityFeePerGas: '1500000000',
      }
    : {
        from: user,
        to: MAINNET_USDC_ADDRESS,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [RELAY_SOLVER_ADDRESS, amountInRaw],
        }),
        value: '0',
        chainId: 1,
        gas: '65000',
        maxFeePerGas: '3000000000',
        maxPriorityFeePerGas: '1500000000',
      };

  return {
    amountOutRaw,
    requestId,
    settlementHash,
    quote: {
      steps: [
        {
          id: 'deposit',
          action: 'Confirm transaction in your wallet',
          description: 'Depositing funds to the relayer to execute the swap',
          kind: 'transaction',
          requestId,
          depositAddress: RELAY_SOLVER_ADDRESS,
          items: [
            {
              status: 'incomplete',
              data: stepData,
              check: {
                endpoint: `/intents/status/v3?requestId=${requestId}`,
                method: 'GET',
              },
            },
          ],
        },
      ],
      fees: {
        gas: zeroFee,
        relayer: zeroFee,
        relayerGas: zeroFee,
        relayerService: zeroFee,
        app: zeroFee,
        subsidized: zeroFee,
      },
      details: {
        operation: 'swap',
        sender: user,
        recipient,
        currencyIn,
        currencyOut,
        refundCurrency: currencyIn,
        totalImpact: { usd: '0', percent: '0' },
        swapImpact: { usd: '0', percent: '0' },
        rate: String(sourcePrice),
        slippageTolerance: {
          origin: { usd: '0', value: '0', percent: '0.00' },
          destination: { usd: '0', value: '0', percent: '0.00' },
        },
        timeEstimate: 15,
        userBalance: '0',
        isFixedRate: true,
        route: [
          {
            action: 'send',
            currency: currencyIn.currency,
            amount: currencyIn.amount,
            amountUsd,
          },
          {
            action: 'receive',
            currency: currencyOut.currency,
            amount: currencyOut.amount,
            amountUsd,
          },
        ],
      },
    },
  };
}

/**
 * Registers the Relay quote mock. Records each served quote's request id,
 * settlement hash and mUSD output so the settlement mocks report the amount
 * the confirmed quote promised.
 *
 * @param server - Mockttp server.
 * @param settlements - Quote → settlement bookkeeping to fill.
 */
async function mockRelayQuote(
  server: Mockttp,
  settlements: RelaySettlements,
): Promise<void> {
  const handler = async (request: {
    body: { getJson: () => Promise<unknown> };
  }) => {
    const body =
      ((await request.body.getJson()) as RelayQuoteRequestBody | undefined) ??
      {};
    if (!body.amount || body.amount === '0') {
      return { statusCode: 400, json: { message: 'Amount is required' } };
    }
    const { quote, amountOutRaw, requestId, settlementHash } =
      buildRelayQuote(body);
    settlements.hashByRequestId.set(requestId.toLowerCase(), settlementHash);
    settlements.amountByHash.set(settlementHash.toLowerCase(), amountOutRaw);
    settlements.lastAmountOutRaw = amountOutRaw;
    return { statusCode: 200, json: quote };
  };

  await server
    .forPost(`${RELAY_API_BASE_URL}/quote`)
    .always()
    .thenCallback(handler);
  await server
    .forPost(/intents\.(uat-)?api\.cx\.metamask\.io\/relay\/quote/u)
    .always()
    .thenCallback(handler);
}

/**
 * All network mocks for the Money Account deposit E2E flows.
 *
 * @param server - Mockttp server.
 * @param options - Mock options.
 * @param options.remoteFlagOverrides - Extra `/v1/flags` overrides.
 */
export async function mockMoneyAccountDeposit(
  server: Mockttp,
  {
    remoteFlagOverrides = {},
  }: { remoteFlagOverrides?: Record<string, Json> } = {},
): Promise<void> {
  const settlements = createRelaySettlements();

  await mockMoneyAccountDepositFlags(server, remoteFlagOverrides);
  await mockPriceApis(server);
  await mockGasApis(server);
  await mockRelayQuote(server, settlements);
  await mockMainnetUsdcBalance(server);
  await mockDepositSettlement(server, settlements);
}

function buildAssetsBalance(accountIds: string[]) {
  return Object.fromEntries(
    accountIds.map((accountId) => [
      accountId,
      {
        [MAINNET_NATIVE_ASSET_ID]: { amount: String(ETH_BALANCE_HUMAN) },
        [MAINNET_USDC_ASSET_ID]: { amount: USDC_BALANCE_RAW.toString(10) },
      },
    ]),
  );
}

/**
 * Builds the Money Account deposit fixture: Mainnet selected against the
 * local Anvil node (chain 1) with USDC + ETH held by the given accounts, the
 * Money Account flags seeded, and USDC/ETH metadata + rates pre-populated so
 * the pay-token picker does not depend on async token discovery.
 *
 * @param options - Fixture options.
 * @param options.withAccount2 - Also restore the second HD account so the
 * deposit can be funded from another account.
 * @param options.remoteFlagOverrides - Extra remote flags seeded into
 * `RemoteFeatureFlagController` state (must also be served by the HTTP mock).
 * @returns The built fixture state.
 */
export function buildMoneyAccountDepositFixture({
  withAccount2 = false,
  remoteFlagOverrides = {},
}: {
  withAccount2?: boolean;
  remoteFlagOverrides?: Record<string, Json>;
} = {}) {
  const accountAddresses = [
    DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
    ...(withAccount2 ? [ACCOUNT_2.toLowerCase()] : []),
  ];
  const accountIds = [
    DEFAULT_FIXTURE_ACCOUNT_ID,
    ...(withAccount2 ? [ACCOUNT_2_FIXTURE_ID] : []),
  ];
  const usdcToken = {
    address: MAINNET_USDC_ADDRESS,
    symbol: 'USDC',
    decimals: 6,
    isERC721: false,
    aggregators: [],
    name: 'USD Coin',
  };

  let builder = new FixtureBuilderV2();
  if (withAccount2) {
    builder = builder
      .withKeyringControllerAdditionalAccountVault()
      .withAccountsControllerAdditionalAccountVault();
  }

  return builder
    .withRemoteFeatureFlagController({
      remoteFeatureFlags: {
        ...MONEY_ACCOUNT_DEPOSIT_REMOTE_FLAGS,
        ...remoteFlagOverrides,
      },
    })
    .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
    .withEnabledNetworks({ eip155: { [CHAIN_IDS.MAINNET]: true } })
    .withTokensController({
      allTokens: {
        [CHAIN_IDS.MAINNET]: Object.fromEntries(
          accountAddresses.map((address) => [address, [usdcToken]]),
        ),
      },
    })
    .withCurrencyController({
      currencyRates: {
        ETH: {
          conversionDate: 0,
          conversionRate: ETH_USD_PRICE,
          usdConversionRate: ETH_USD_PRICE,
        },
      },
    })
    .withAssetsController({
      customAssets: Object.fromEntries(
        accountIds.map((accountId) => [accountId, [MAINNET_USDC_ASSET_ID]]),
      ),
      assetsBalance: buildAssetsBalance(accountIds),
      assetsInfo: {
        [MAINNET_NATIVE_ASSET_ID]: {
          type: 'native',
          symbol: 'ETH',
          name: 'Ether',
          decimals: 18,
        },
        [MAINNET_USDC_ASSET_ID]: {
          type: 'erc20',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        },
        // Pay resolves the deposit's required token (mUSD on Monad) from
        // AssetsController state: it needs the token metadata plus a fiat
        // rate for both mUSD and the chain's native asset, otherwise the
        // amount screen never leaves its skeleton.
        [MONAD_NATIVE_ASSET_ID]: {
          type: 'native',
          symbol: 'MON',
          name: 'Monad',
          decimals: 18,
        },
        [MUSD_MONAD_ASSET_ID]: {
          type: 'erc20',
          symbol: 'mUSD',
          name: 'MetaMask USD',
          decimals: 6,
        },
      },
      assetsPrice: {
        // Pay's `currencyRates` are keyed by ticker, so every chain whose
        // native asset is "ETH" in the default fixture must agree on the ETH
        // price or the USDC → USD conversion mixes rates from two chains.
        ...DEFAULT_FIXTURE_ETH_NATIVE_PRICES,
        [MONAD_NATIVE_ASSET_ID]: fungibleAssetPrice('monad', MON_USD_PRICE),
        [MUSD_MONAD_ASSET_ID]: fungibleAssetPrice(
          'metamask-usd',
          MUSD_USD_PRICE,
        ),
        [MAINNET_NATIVE_ASSET_ID]: fungibleAssetPrice(
          'ethereum',
          ETH_USD_PRICE,
        ),
        [MAINNET_USDC_ASSET_ID]: fungibleAssetPrice('usd-coin', USDC_USD_PRICE),
      },
    })
    .build();
}

/**
 * Seeds `amountHuman` USDC for `address` on the local Anvil node by writing the
 * ERC-20 balance slot directly, matching how `with100Usdc100Usdt.json` funds
 * the default account.
 *
 * @param localNode - The running Anvil node (chain 1).
 * @param address - Account to fund.
 * @param amountHuman - USDC amount in whole tokens.
 */
export async function seedAnvilUsdcBalance(
  localNode: Anvil,
  address: Hex,
  amountHuman: number,
): Promise<void> {
  const { testClient } = localNode.getProvider();
  const slotKey = keccak256(
    `0x${pad(address, { size: 32 }).slice(2)}${pad(
      toHex(ANVIL_USDC_BALANCES_SLOT),
      { size: 32 },
    ).slice(2)}`,
  );
  await testClient.setStorageAt({
    address: MAINNET_USDC_ADDRESS,
    index: slotKey,
    value: pad(toHex(BigInt(amountHuman) * 10n ** 6n), { size: 32 }),
  });
}

/**
 * `withFixtures` options shared by the Money Account deposit specs.
 *
 * @param options - Config options.
 * @param options.title - Test title for debugging.
 * @param options.withAccount2 - Restore the second HD account and fund it with
 * USDC on Anvil.
 * @param options.remoteFlagOverrides - Extra remote flags applied to both the
 * seeded controller state and the `/v1/flags` mock.
 * @returns Partial `withFixtures` config.
 */
export function getMoneyAccountDepositConfig({
  title,
  withAccount2 = false,
  remoteFlagOverrides = {},
}: {
  title?: string;
  withAccount2?: boolean;
  remoteFlagOverrides?: Record<string, Json>;
}) {
  return {
    fixtures: buildMoneyAccountDepositFixture({
      withAccount2,
      remoteFlagOverrides,
    }),
    title,
    localNodeOptions: [
      {
        type: 'anvil',
        options: {
          chainId: 1,
          loadState: './test/e2e/seeder/network-states/with100Usdc100Usdt.json',
        },
      },
    ],
    ethConversionInUsd: ETH_USD_PRICE,
    // The Money Account upgrade pipeline (CHOMP association, delegations,
    // intents) runs in the background and is not mocked here; its retries log
    // step errors that are unrelated to the deposit under test.
    ignoredConsoleErrors: ['MoneyAccountUpgradeStepError'],
    unifiedEvmAccountsApiBalances: {
      mainnetAdditionalBalances: [
        {
          assetId: MAINNET_USDC_ASSET_ID_LOWERCASE,
          balance: USDC_BALANCE_RAW.toString(10),
        },
      ],
    },
    afterLocalNodesStart: async ({ localNodes }: { localNodes: Anvil[] }) => {
      if (withAccount2) {
        await seedAnvilUsdcBalance(
          localNodes[0],
          ACCOUNT_2 as Hex,
          USDC_BALANCE_HUMAN,
        );
      }
    },
    testSpecificMock: (server: Mockttp) =>
      mockMoneyAccountDeposit(server, { remoteFlagOverrides }),
  };
}
