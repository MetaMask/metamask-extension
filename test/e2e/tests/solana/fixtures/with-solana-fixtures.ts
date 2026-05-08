import { MockedEndpoint, Mockttp } from 'mockttp';
import { DEFAULT_FIXTURE_SOLANA_ACCOUNT } from '../../../constants';
import { withFixtures } from '../../../helpers';
import {
  LAMPORTS_PER_SOL,
  SolanaLocalNodeOptions,
  SolanaNode,
} from '../../../seeder/solana/node';
import {
  mockAccountsApi,
  mockClientSideDetectionApi,
  mockMultiCoinPrice,
  mockPhishingDetectionApi,
  mockPriceApiExchangeRates,
  mockPriceApiSpotPrice,
  mockStaticMetamaskTokenIconMainnet,
  mockTokenApiMainnetTest,
} from '../common-solana';
import { proxySolanaBlockchainCalls } from '../mocks/local-solana-node-mocks';

type WithFixturesOptions = Parameters<typeof withFixtures>[0];
type WithFixturesTestSuite = Parameters<typeof withFixtures>[1];

export type SolanaFixtureAccount = {
  address: string;
  balanceLamports?: number;
  balanceSol?: number;
};

export type WithSolanaFixturesOptions = Omit<
  WithFixturesOptions,
  'localNodeOptions' | 'testSpecificMock'
> & {
  accounts?: SolanaFixtureAccount[];
  includeAnvil?: boolean;
  testSpecificMock?: (
    mockServer: Mockttp,
    context: { localNodes: unknown[] },
  ) => Promise<MockedEndpoint[]>;
};

export function buildSolanaNodeOptions(
  accounts: SolanaFixtureAccount[] = [
    { address: DEFAULT_FIXTURE_SOLANA_ACCOUNT, balanceSol: 50 },
  ],
): SolanaLocalNodeOptions {
  return {
    initialBalances: Object.fromEntries(
      accounts.map((account) => [
        account.address,
        account.balanceLamports ??
          Math.round((account.balanceSol ?? 0) * LAMPORTS_PER_SOL),
      ]),
    ),
  };
}

export async function withSolanaFixtures(
  options: WithSolanaFixturesOptions,
  testSuite: WithFixturesTestSuite,
): Promise<void> {
  const {
    accounts,
    includeAnvil = true,
    testSpecificMock,
    ...withFixtureOptions
  } = options;

  await withFixtures(
    {
      ...withFixtureOptions,
      localNodeOptions: [
        ...(includeAnvil ? ['anvil'] : []),
        {
          type: 'solana',
          options: buildSolanaNodeOptions(accounts),
        },
      ],
      testSpecificMock: async (
        mockServer: Mockttp,
        context: { localNodes: unknown[] },
      ) => {
        const customEndpoints =
          (await testSpecificMock?.(mockServer, context)) ?? [];
        const solanaEndpoints = await mockSolanaFixtureApis(mockServer, {
          localNodes: context.localNodes,
        });
        return [...customEndpoints, ...solanaEndpoints];
      },
    },
    testSuite,
  );
}

async function mockSolanaFixtureApis(
  mockServer: Mockttp,
  { localNodes }: { localNodes: unknown[] },
): Promise<MockedEndpoint[]> {
  const solanaNode = localNodes.find(
    (node): node is SolanaNode => node instanceof SolanaNode,
  );
  if (!solanaNode) {
    throw new Error('Solana local node was not started');
  }

  return [
    await mockMultiCoinPrice(mockServer),
    await mockPriceApiSpotPrice(mockServer),
    await mockPriceApiExchangeRates(mockServer),
    await mockClientSideDetectionApi(mockServer),
    await mockPhishingDetectionApi(mockServer),
    await mockStaticMetamaskTokenIconMainnet(mockServer),
    await mockTokenApiMainnetTest(mockServer),
    await mockAccountsApi(mockServer),
    ...(await proxySolanaBlockchainCalls(mockServer, solanaNode)),
  ];
}
