import { MockedEndpoint, Mockttp } from 'mockttp';
import { DEFAULT_FIXTURE_SOLANA_ACCOUNT } from '../../../constants';
import { withFixtures } from '../../../helpers';
import {
  LAMPORTS_PER_SOL,
  SolanaLocalNodeOptions,
  SolanaNode,
} from '../../../seeder/solana/node';
import {
  type SolanaFixtureAsset,
  type SolanaSeederAccount,
  getSolanaAssetId,
} from '../../../seeder/solana/assets';
import {
  type SolanaAssetRegistry,
  SolanaSeeder,
} from '../../../seeder/solana/solana-seeder';
import {
  mockAccountsApi,
  mockClientSideDetectionApi,
  mockMultiCoinPrice,
  mockPhishingDetectionApi,
  mockPriceApiExchangeRates,
  mockStaticMetamaskTokenIconMainnet,
} from '../common-solana';
import { proxySolanaBlockchainCalls } from '../mocks/local-solana-node-mocks';

type WithFixturesOptions = Parameters<typeof withFixtures>[0];
type WithFixturesTestSuite = Parameters<typeof withFixtures>[1];

export type SolanaFixtureAccount = SolanaSeederAccount & {
  address: string;
  assets?: SolanaFixtureAsset[];
  balance?: number;
  balanceLamports?: number;
  balanceSol?: number;
};

export type WithSolanaFixturesOptions = Omit<
  WithFixturesOptions,
  'localNodeOptions' | 'testSpecificMock'
> & {
  accounts?: SolanaFixtureAccount[];
  afterLocalNodesStart?: (context: {
    localNodes: unknown[];
  }) => Promise<void> | void;
  fixtures?: unknown;
  includeAnvil?: boolean;
  solanaState?: string;
  testSpecificMock?: (
    mockServer: Mockttp,
    context: { localNodes: unknown[] },
  ) => Promise<MockedEndpoint[]>;
  title?: string;
};

const DEFAULT_SOLANA_FIXTURE_ACCOUNTS: SolanaFixtureAccount[] = [
  {
    address: DEFAULT_FIXTURE_SOLANA_ACCOUNT,
    assets: [
      {
        balance: 50,
        decimals: 9,
        name: 'Solana',
        symbol: 'SOL',
        type: 'native',
      },
    ],
  },
];

export function buildSolanaNodeOptions(
  accounts: SolanaFixtureAccount[] = DEFAULT_SOLANA_FIXTURE_ACCOUNTS,
  options: Pick<SolanaLocalNodeOptions, 'loadState'> = {},
): SolanaLocalNodeOptions {
  return {
    initialBalances: Object.fromEntries(
      accounts.map((account) => [account.address, getNativeLamports(account)]),
    ),
    ...(options.loadState ? { loadState: options.loadState } : {}),
  };
}

export async function withSolanaFixtures(
  options: WithSolanaFixturesOptions,
  testSuite: WithFixturesTestSuite,
): Promise<void> {
  const {
    accounts,
    includeAnvil = true,
    solanaState,
    testSpecificMock,
    afterLocalNodesStart,
    ...withFixtureOptions
  } = options;
  const fixtureAccounts = accounts ?? DEFAULT_SOLANA_FIXTURE_ACCOUNTS;
  let solanaSeeder: SolanaSeeder | undefined;

  await withFixtures(
    {
      ...withFixtureOptions,
      localNodeOptions: [
        ...(includeAnvil ? ['anvil'] : []),
        {
          type: 'solana',
          options: buildSolanaNodeOptions(fixtureAccounts, {
            loadState: solanaState,
          }),
        },
      ],
      afterLocalNodesStart: async (context: { localNodes: unknown[] }) => {
        solanaSeeder = await seedSolanaAssets(
          context.localNodes,
          fixtureAccounts,
        );
        await afterLocalNodesStart?.(context);
      },
      testSpecificMock: async (
        mockServer: Mockttp,
        context: { localNodes: unknown[] },
      ) => {
        const customEndpoints =
          (await testSpecificMock?.(mockServer, context)) ?? [];
        const solanaEndpoints = await mockSolanaFixtureApis(mockServer, {
          accounts: fixtureAccounts,
          assetRegistry: solanaSeeder?.getAssetRegistry(),
          localNodes: context.localNodes,
        });
        return [...customEndpoints, ...solanaEndpoints];
      },
    },
    async (context) => {
      await testSuite({
        ...context,
        assetRegistry: solanaSeeder?.getAssetRegistry(),
      });
    },
  );
}

async function seedSolanaAssets(
  localNodes: unknown[],
  accounts: SolanaFixtureAccount[],
): Promise<SolanaSeeder | undefined> {
  if (!accounts.some((account) => hasSeedAssets(account.assets))) {
    return undefined;
  }

  const solanaNode = localNodes.find(
    (node): node is SolanaNode => node instanceof SolanaNode,
  );
  if (!solanaNode) {
    throw new Error('Solana local node was not started');
  }

  const seeder = new SolanaSeeder(solanaNode);
  await seeder.seedAccountAssets(accounts);
  return seeder;
}

async function mockSolanaFixtureApis(
  mockServer: Mockttp,
  {
    accounts,
    assetRegistry,
    localNodes,
  }: {
    accounts: SolanaFixtureAccount[];
    assetRegistry?: SolanaAssetRegistry;
    localNodes: unknown[];
  },
): Promise<MockedEndpoint[]> {
  const solanaNode = localNodes.find(
    (node): node is SolanaNode => node instanceof SolanaNode,
  );
  if (!solanaNode) {
    throw new Error('Solana local node was not started');
  }

  return [
    await mockMultiCoinPrice(mockServer),
    await mockSolanaFixtureSpotPrices(mockServer, accounts, assetRegistry),
    await mockPriceApiExchangeRates(mockServer),
    await mockClientSideDetectionApi(mockServer),
    await mockPhishingDetectionApi(mockServer),
    await mockStaticMetamaskTokenIconMainnet(mockServer),
    await mockSolanaFixtureTokenApi(mockServer, accounts, assetRegistry),
    await mockAccountsApi(mockServer),
    ...(await proxySolanaBlockchainCalls(mockServer, solanaNode)),
  ];
}

async function mockSolanaFixtureTokenApi(
  mockServer: Mockttp,
  accounts: SolanaFixtureAccount[],
  assetRegistry: SolanaAssetRegistry | undefined,
): Promise<MockedEndpoint> {
  return await mockServer
    .forGet('https://tokens.api.cx.metamask.io/v3/assets')
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: getSolanaFixtureAssets(accounts).map((asset) => ({
        assetId: getSolanaFixtureAssetId(asset, assetRegistry),
        decimals: asset.type === 'nft' ? 0 : asset.decimals,
        name: asset.name,
        symbol: asset.symbol,
      })),
    }));
}

async function mockSolanaFixtureSpotPrices(
  mockServer: Mockttp,
  accounts: SolanaFixtureAccount[],
  assetRegistry: SolanaAssetRegistry | undefined,
): Promise<MockedEndpoint> {
  const pricesByAssetId = Object.fromEntries(
    getSolanaFixtureAssets(accounts).map((asset) => [
      getSolanaFixtureAssetId(asset, assetRegistry),
      createSpotPriceResponse(asset),
    ]),
  );

  return await mockServer
    .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
    .always()
    .thenCallback((request) => {
      const assetIds = new URL(request.url).searchParams
        .get('assetIds')
        ?.split(',');

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

export function getSolanaFixtureAssets(
  accounts: SolanaFixtureAccount[],
): SolanaFixtureAsset[] {
  const assetsByKey = new Map<string, SolanaFixtureAsset>();
  for (const account of accounts) {
    for (const asset of getAccountAssets(account)) {
      assetsByKey.set(`${asset.type}:${asset.symbol}`, asset);
    }
  }
  return [...assetsByKey.values()];
}

function getAccountAssets(account: SolanaFixtureAccount): SolanaFixtureAsset[] {
  if (account.assets) {
    return account.assets;
  }

  return [
    {
      balance:
        account.balance ??
        account.balanceSol ??
        (account.balanceLamports ?? 0) / LAMPORTS_PER_SOL,
      decimals: 9,
      name: 'Solana',
      symbol: 'SOL',
      type: 'native',
    },
  ];
}

function getNativeLamports(account: SolanaFixtureAccount): number {
  if (account.balanceLamports !== undefined) {
    return account.balanceLamports;
  }

  const nativeAsset = getAccountAssets(account).find(
    (asset) => asset.type === 'native',
  );
  const balanceSol =
    nativeAsset?.balance ?? account.balance ?? account.balanceSol ?? 0;

  return Math.round(balanceSol * LAMPORTS_PER_SOL);
}

function hasSeedAssets(assets: SolanaFixtureAsset[] | undefined): boolean {
  return (assets ?? []).some((asset) => asset.type !== 'native');
}

function getSolanaFixtureAssetId(
  asset: SolanaFixtureAsset,
  assetRegistry: SolanaAssetRegistry | undefined,
): string {
  return getSolanaAssetId(
    asset,
    asset.type === 'native'
      ? undefined
      : assetRegistry?.getMintAddress(asset.symbol),
  );
}

function createSpotPriceResponse(asset: SolanaFixtureAsset) {
  if (asset.priceUsd === undefined || asset.priceUsd === null) {
    return null;
  }

  return {
    id: asset.symbol.toLowerCase(),
    marketCap: 1_000_000,
    price: asset.priceUsd,
    pricePercentChange1d: 0,
  };
}
