/* eslint-disable @typescript-eslint/naming-convention */
import { MockedEndpoint, Mockttp } from "mockttp";
import { withFixtures } from "../../../helpers";
import {
  TronLocalNodeOptions,
  TronTrc10Symbol,
  TronTrc20Symbol,
  createEmptyTronGridTransactionsResponse,
  createTronGridAccountResponse,
} from "../../../seeder/tron/assets";
import { TronNode } from "../../../seeder/tron/node";
import { TronSeeder } from "../../../seeder/tron/tron-seeder";
import { mockTokensV2SupportedNetworks } from "../../btc/mocks/tokens-api";
import {
  TRON_ACCOUNT_ADDRESS,
  TRON_CHAIN_ID,
  TRON_RECIPIENT_ADDRESS,
  SUN_PER_TRX,
  mockAccountsApiV2WithTron,
  mockBridgeGetTronTokens,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockTronFeatureFlags,
  mockTronGetReward,
} from "../mocks/common-tron";
import { proxyTronBlockchainCalls } from "../mocks/local-tron-node-mocks";

const TRON_PROVIDER_ANY_ACCOUNT_RE =
  /^(https:\/\/tron-mainnet\.infura\.io\/v3\/[^/]+|https:\/\/api\.trongrid\.io|https:\/\/api\.shasta\.trongrid\.io|https:\/\/nile\.trongrid\.io)\/v1\/accounts\/([A-Za-z0-9]{20,})(\/transactions(\/trc20)?)?(\?.*)?$/u;

type WithFixturesOptions = Parameters<typeof withFixtures>[0];
type WithFixturesTestSuite = Parameters<typeof withFixtures>[1];
export type TronFixturesTestSuiteContext = Parameters<WithFixturesTestSuite>[0] & {
  localNodes: unknown[];
};

type TronFixturesTestSuite = (context: TronFixturesTestSuiteContext) => Promise<void> | void;

export type TronFixtureAsset =
  | TronNativeFixtureAsset
  | TronTrc10FixtureAsset
  | TronTrc20FixtureAsset;

export type TronNativeFixtureAsset = {
  balance: number;
  decimals: number;
  name: string;
  priceUsd?: number | null;
  symbol: "TRX";
  type: "native";
};

export type TronTrc10FixtureAsset = {
  balance: string;
  decimals: number;
  name: string;
  priceUsd?: number | null;
  symbol: string;
  tokenId: string;
  type: "trc10";
};

export type TronTrc20FixtureAsset = {
  address: string;
  balance: string;
  decimals: number;
  name: string;
  priceUsd?: number | null;
  symbol: string;
  type: "trc20";
};

export type TronFixtureAccount = {
  address: string;
  assets?: TronFixtureAsset[];
  transactions?: {
    raw?: unknown[];
    trc20?: unknown[];
  };
};

export type WithTronFixturesOptions = Omit<
  WithFixturesOptions,
  "localNodeOptions" | "testSpecificMock"
> & {
  accounts: TronFixtureAccount[];
  afterLocalNodesStart?: (context: { localNodes: unknown[] }) => Promise<void> | void;
  borrowedTronNode?: TronNode;
  fixtures?: unknown;
  includeAnvil?: boolean;
  ignoredConsoleErrors?: string[];
  manifestFlags?: Record<string, unknown>;
  testSpecificMock?: (
    mockServer: Mockttp,
    context: { localNodes: unknown[] },
  ) => Promise<MockedEndpoint[]>;
  title?: string;
};

export function buildTronNodeOptions(accounts: TronFixtureAccount[]): TronLocalNodeOptions {
  const initialBalances: Record<string, number> = {};
  const trc10Balances: Record<string, Partial<Record<TronTrc10Symbol, string>>> = {};
  const trc20Balances: Record<string, Partial<Record<TronTrc20Symbol, string>>> = {};
  for (const account of accounts) {
    for (const asset of account.assets ?? []) {
      if (asset.type === "native") {
        initialBalances[account.address] = asset.balance;
      } else if (asset.type === "trc10") {
        trc10Balances[account.address] = {
          ...trc10Balances[account.address],
          [asset.symbol]: asset.balance,
        };
      } else {
        trc20Balances[account.address] = {
          ...trc20Balances[account.address],
          [asset.symbol]: asset.balance,
        };
      }
    }
  }

  return {
    ...(Object.keys(initialBalances).length ? { initialBalances } : {}),
    ...(Object.keys(trc10Balances).length ? { trc10Balances } : {}),
    ...(Object.keys(trc20Balances).length ? { trc20Balances } : {}),
  };
}

export type TronFixtureLocalNodeOption =
  | "anvil"
  | "none"
  | { type: "tron"; options: TronLocalNodeOptions };

/**
 * Builds `withFixtures` local-node options. A borrowed Java-Tron node is not
 * started again; pass `'none'` when nothing else needs to boot.
 *
 * @param options - Node reuse and Anvil flags
 * @param options.borrowedTronNode - Suite-owned node started in `before`
 * @param options.includeAnvil - Whether to start Anvil alongside Tron
 * @param options.startupNodeOptions - Options used only when starting a new node
 * @returns Local node descriptors for `withFixtures`
 */
export function resolveTronFixtureLocalNodeOptions({
  borrowedTronNode,
  includeAnvil = true,
  startupNodeOptions,
}: {
  borrowedTronNode?: TronNode;
  includeAnvil?: boolean;
  startupNodeOptions: TronLocalNodeOptions;
}): TronFixtureLocalNodeOption[] {
  const localNodeOptions: TronFixtureLocalNodeOption[] = [
    ...(includeAnvil ? (["anvil"] as const) : []),
    ...(borrowedTronNode ? [] : [{ type: "tron" as const, options: startupNodeOptions }]),
  ];
  if (localNodeOptions.length === 0) {
    localNodeOptions.push("none");
  }
  return localNodeOptions;
}

export async function withTronFixtures(
  options: WithTronFixturesOptions,
  testSuite: TronFixturesTestSuite,
): Promise<void> {
  const {
    afterLocalNodesStart,
    accounts,
    borrowedTronNode,
    includeAnvil = true,
    ignoredConsoleErrors = [],
    testSpecificMock,
    ...withFixtureOptions
  } = options;
  const nodeOptions = buildTronNodeOptions(accounts);
  const { trc20Balances, ...startupNodeOptions } = nodeOptions;
  const localNodeOptions = [
    ...(includeAnvil ? ["anvil"] : []),
    ...(borrowedTronNode
      ? []
      : [
          {
            type: "tron",
            options: startupNodeOptions,
          },
        ]),
  ];
  if (localNodeOptions.length === 0) {
    localNodeOptions.push("none");
  }
  let tronSeeder: TronSeeder | undefined;
  // Captured in afterLocalNodesStart (which runs before the network mocks are
  // set up) so the fixture mocks can talk to the local Tron node.
  // withFixtures' testSpecificMock keeps its single-argument contract.
  let capturedLocalNodes: unknown[] = [];

  await withFixtures(
    {
      ...withFixtureOptions,
      // Chrome records unmocked subscription RPC failures and Snap JSON-RPC
      // parse errors while extra HD accounts derive. withFixtures then opens
      // the background page to capture them; that navigate times out on
      // `.controller-loaded` and masks the real assertion result.
      ignoredConsoleErrors: [
        "getSubscriptions",
        // Matches both `JsonRpcError: Unexpected end of JSON input` and the
        // SES-wrapped `SES_UNHANDLED_REJECTION: -32603, ..., Unexpected end of JSON input`.
        "Unexpected end of JSON input",
        ...ignoredConsoleErrors,
      ],
      localNodeOptions,
      afterLocalNodesStart: async (context: { localNodes: unknown[] }) => {
        capturedLocalNodes = borrowedTronNode
          ? [...context.localNodes, borrowedTronNode]
          : context.localNodes;
        if (!borrowedTronNode) {
          tronSeeder = await seedTronSmartContracts(capturedLocalNodes, trc20Balances);
        }
        await afterLocalNodesStart?.({ localNodes: capturedLocalNodes });
      },
      testSpecificMock: async (mockServer: Mockttp) => {
        const customEndpoints =
          (await testSpecificMock?.(mockServer, {
            localNodes: capturedLocalNodes,
          })) ?? [];
        const tronEndpoints = await mockTronFixtureApis(mockServer, {
          accounts,
          localNodes: capturedLocalNodes,
        });
        return [...customEndpoints, ...tronEndpoints];
      },
    },
    async (context) => {
      await testSuite({
        ...context,
        localNodes: capturedLocalNodes,
        contractRegistry: context.contractRegistry ?? tronSeeder?.getContractRegistry(),
      });
    },
  );
}

async function seedTronSmartContracts(
  localNodes: unknown[],
  trc20Balances: TronLocalNodeOptions["trc20Balances"],
): Promise<TronSeeder | undefined> {
  if (!trc20Balances || Object.keys(trc20Balances).length === 0) {
    return undefined;
  }

  const tronNode = localNodes.find((node): node is TronNode => node instanceof TronNode);
  if (!tronNode) {
    throw new Error("Tron local node was not started");
  }

  const seeder = new TronSeeder(tronNode);
  await seeder.seedSmartContractBalances(trc20Balances);
  return seeder;
}

async function mockTronFixtureApis(
  mockServer: Mockttp,
  { accounts, localNodes }: { accounts: TronFixtureAccount[]; localNodes: unknown[] },
): Promise<MockedEndpoint[]> {
  const tronNode = localNodes.find((node): node is TronNode => node instanceof TronNode);
  if (!tronNode) {
    throw new Error("Tron local node was not started");
  }

  const accountByAddress = new Map(accounts.map((account) => [account.address, account]));
  const fixtureHistoryEndpoints = await mockFixtureTransactionHistory(mockServer, accounts);

  const allAddresses = [...accounts.map((a) => a.address), TRON_RECIPIENT_ADDRESS].filter(
    (v, i, arr) => arr.indexOf(v) === i,
  );

  return [
    await mockTokensV2SupportedNetworks(mockServer),
    // Empty catch-all bodies make fetchPopularTokens throw
    // "Unexpected end of JSON input" during the Tron network switch.
    await mockBridgeGetTronTokens(mockServer),
    await mockAccountsApiV2WithTron(mockServer),
    await mockTronFixtureAccountsApiV5(mockServer, accounts, tronNode),
    await mockTronFeatureFlags(mockServer),
    await mockExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockTronFixtureSpotPrices(mockServer, accounts, tronNode),
    await mockTronFixtureAssets(mockServer, accounts, tronNode),
    await mockTronGetReward(mockServer),
    // NOTE: do not register static getblock/getnowblock/getblockbynum or
    // broadcasttransaction mocks here. mockttp serves the first matching
    // `.always()` rule, so a static block mock makes the snap sign against a
    // stale ref block and java-tron rejects the broadcast with TAPOS_ERROR.
    // `proxyTronBlockchainCalls` proxies those endpoints to the local node and
    // replays successful broadcasts as confirmed history.
    ...fixtureHistoryEndpoints,
    ...(await proxyTronBlockchainCalls(mockServer, tronNode, allAddresses)),
    await mockWildcardTronAccountApis(mockServer, tronNode, accountByAddress),
  ];
}

async function mockFixtureTransactionHistory(
  mockServer: Mockttp,
  accounts: TronFixtureAccount[],
): Promise<MockedEndpoint[]> {
  const endpoints: MockedEndpoint[] = [];

  for (const account of accounts) {
    if (!account.transactions) {
      continue;
    }

    endpoints.push(
      await mockServer
        .forGet(tronProviderUrl(`/v1/accounts/${account.address}/transactions`))
        .always()
        .thenCallback(() => createTransactionsResponse(account.transactions?.raw)),
      await mockServer
        .forGet(tronProviderUrl(`/v1/accounts/${account.address}/transactions/trc20`))
        .always()
        .thenCallback(() => createTransactionsResponse(account.transactions?.trc20)),
    );
  }

  return endpoints;
}

async function mockWildcardTronAccountApis(
  mockServer: Mockttp,
  tronNode: TronNode,
  accountByAddress: Map<string, TronFixtureAccount>,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(TRON_PROVIDER_ANY_ACCOUNT_RE)
    .always()
    .thenCallback(async (req) => {
      const match = req.url.match(TRON_PROVIDER_ANY_ACCOUNT_RE);
      const address = match?.[2] ?? "";
      const suffix = match?.[3] ?? "";
      const account = accountByAddress.get(address);

      if (suffix.startsWith("/transactions")) {
        const transactions = suffix.includes("/trc20")
          ? account?.transactions?.trc20
          : account?.transactions?.raw;
        return createTransactionsResponse(transactions);
      }

      if (account) {
        return {
          statusCode: 200,
          json: await tronNode.getTronGridAccountResponse(address),
        };
      }

      return {
        statusCode: 200,
        json: createTronGridAccountResponse({ address }),
      };
    });
}

function formatFixtureBalanceForAccountsApi(asset: TronFixtureAsset): string {
  if (asset.type === "native") {
    return String(asset.balance / SUN_PER_TRX);
  }

  return String(Number(asset.balance) / 10 ** asset.decimals);
}

function buildFixtureTokenMetadata(accounts: TronFixtureAccount[], tronNode: TronNode) {
  const nativeTrx = {
    assetId: `${TRON_CHAIN_ID}/slip44:195`,
    decimals: 6,
    name: "Tron",
    symbol: "TRX",
  };

  const fixtureAssets = getUniqueAssets(accounts).map((asset) => ({
    assetId: getAssetId(asset, tronNode),
    decimals: asset.decimals,
    name: asset.name,
    symbol: asset.symbol,
  }));

  const assetsById = new Map([nativeTrx, ...fixtureAssets].map((asset) => [asset.assetId, asset]));

  return [...assetsById.values()];
}

async function mockTronFixtureAccountsApiV5(
  mockServer: Mockttp,
  accounts: TronFixtureAccount[],
  tronNode: TronNode,
): Promise<MockedEndpoint> {
  const balances = accounts.flatMap((account) => {
    const assetBalances = (account.assets ?? []).map((asset) => ({
      accountId: `${TRON_CHAIN_ID}:${account.address}`,
      assetId: getAssetId(asset, tronNode),
      balance: formatFixtureBalanceForAccountsApi(asset),
    }));

    return assetBalances;
  });

  return mockServer
    .forGet(/https:\/\/accounts\.api\.cx\.metamask\.io\/v5\/multiaccount\/balances/u)
    .always()
    .thenCallback((request) => {
      const requestedAccountIds = new Set(
        new URL(request.url).searchParams
          .getAll("accountIds")
          .flatMap((accountIds) => accountIds.split(",")),
      );
      const requestedBalances = balances.filter(
        ({ accountId }) => requestedAccountIds.size === 0 || requestedAccountIds.has(accountId),
      );

      return {
        statusCode: 200,
        json: {
          count: requestedBalances.length,
          unprocessedNetworks: [],
          balances: requestedBalances,
        },
      };
    });
}

async function mockTronFixtureAssets(
  mockServer: Mockttp,
  accounts: TronFixtureAccount[],
  tronNode: TronNode,
): Promise<MockedEndpoint> {
  const knownAssets = buildFixtureTokenMetadata(accounts, tronNode);

  return mockServer
    .forGet("https://tokens.api.cx.metamask.io/v3/assets")
    .always()
    .thenCallback((request) => {
      const assetIdsParam = new URL(request.url).searchParams.get("assetIds") ?? "";

      const json =
        assetIdsParam.length > 0
          ? knownAssets.filter((asset) => assetIdsParam.includes(asset.assetId))
          : knownAssets.filter((asset) => !asset.assetId.endsWith("/slip44:195"));

      return {
        statusCode: 200,
        json,
      };
    });
}

async function mockTronFixtureSpotPrices(
  mockServer: Mockttp,
  accounts: TronFixtureAccount[],
  tronNode: TronNode,
): Promise<MockedEndpoint> {
  const pricesByAssetId = Object.fromEntries([
    ["tron:3448148188/slip44:195", null],
    ["tron:2494104990/slip44:195", null],
    ...getUniqueAssets(accounts).map((asset) => [
      getAssetId(asset, tronNode),
      createSpotPriceResponse(asset),
    ]),
  ]);

  return mockServer
    .forGet("https://price.api.cx.metamask.io/v3/spot-prices")
    .always()
    .thenCallback((request) => {
      const assetIds = new URL(request.url).searchParams.get("assetIds")?.split(",");

      return {
        statusCode: 200,
        json: Object.fromEntries(
          (assetIds ?? Object.keys(pricesByAssetId)).map((assetId) => [
            assetId,
            pricesByAssetId[assetId] ?? null,
          ]),
        ),
      };
    });
}

function createSpotPriceResponse(asset: TronFixtureAsset) {
  if (asset.priceUsd === undefined || asset.priceUsd === null) {
    return null;
  }

  return {
    id: asset.symbol.toLowerCase(),
    price: asset.priceUsd,
    marketCap: 1_000_000,
    pricePercentChange1d: 0,
  };
}

function createTransactionsResponse(transactions: unknown[] | undefined) {
  const data = transactions ?? [];
  return {
    statusCode: 200,
    json: {
      ...createEmptyTronGridTransactionsResponse(),
      data,
      meta: {
        at: Date.now(),
        page_size: data.length,
      },
    },
  };
}

function getAssetId(asset: TronFixtureAsset, tronNode: TronNode): string {
  if (asset.type === "native") {
    return `${TRON_CHAIN_ID}/slip44:195`;
  }

  if (asset.type === "trc10") {
    const token = tronNode.trc10Tokens[asset.symbol as TronTrc10Symbol];
    return `${TRON_CHAIN_ID}/trc10:${token?.tokenId ?? asset.tokenId}`;
  }

  const token = tronNode.trc20Tokens[asset.symbol as TronTrc20Symbol];
  return `${TRON_CHAIN_ID}/trc20:${token?.address ?? asset.address}`;
}

function getUniqueAssets(accounts: TronFixtureAccount[]): TronFixtureAsset[] {
  const assetsByKey = new Map<string, TronFixtureAsset>();
  for (const account of accounts) {
    for (const asset of account.assets ?? []) {
      assetsByKey.set(`${asset.type}:${asset.symbol}`, asset);
    }
  }
  return [...assetsByKey.values()];
}

function tronProviderUrl(path: string): RegExp {
  return new RegExp(
    `^(https://tron-mainnet\\.infura\\.io/v3/[^/]+|https://api\\.trongrid\\.io|https://api\\.shasta\\.trongrid\\.io|https://nile\\.trongrid\\.io)${path}(\\?[^#]*)?$`,
    "u",
  );
}
