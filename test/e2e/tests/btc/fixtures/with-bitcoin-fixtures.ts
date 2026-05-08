import { MockedEndpoint, Mockttp } from 'mockttp';
import { DEFAULT_BTC_ADDRESS, DEFAULT_BTC_BALANCE } from '../../../constants';
import { withFixtures } from '../../../helpers';
import {
  BitcoinRegtestLocalNodeOptions,
  BitcoinRegtestNode,
} from '../../../seeder/bitcoin/node';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from '../mocks/min-api';
import {
  mockCurrencyExchangeRates,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
} from '../mocks/price-api';
import { proxyBitcoinBlockchainCalls } from '../mocks/local-bitcoin-node-mocks';

type WithFixturesOptions = Parameters<typeof withFixtures>[0];
type WithFixturesTestSuite = Parameters<typeof withFixtures>[1];

export type BitcoinFixtureAccount = {
  address: string;
  balanceBtc?: number;
};

export type WithBitcoinFixturesOptions = Omit<
  WithFixturesOptions,
  'localNodeOptions' | 'testSpecificMock'
> & {
  accounts?: BitcoinFixtureAccount[];
  includeAnvil?: boolean;
  testSpecificMock?: (
    mockServer: Mockttp,
    context: { localNodes: unknown[] },
  ) => Promise<MockedEndpoint[]>;
};

export function buildBitcoinNodeOptions(
  accounts: BitcoinFixtureAccount[] = [
    { address: DEFAULT_BTC_ADDRESS, balanceBtc: DEFAULT_BTC_BALANCE },
  ],
): BitcoinRegtestLocalNodeOptions {
  return {
    initialBalances: Object.fromEntries(
      accounts.map((account) => [
        account.address,
        account.balanceBtc ?? DEFAULT_BTC_BALANCE,
      ]),
    ),
  };
}

export async function withBitcoinFixtures(
  options: WithBitcoinFixturesOptions,
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
          type: 'bitcoin',
          options: buildBitcoinNodeOptions(accounts),
        },
      ],
      testSpecificMock: async (
        mockServer: Mockttp,
        context: { localNodes: unknown[] },
      ) => {
        const customEndpoints =
          (await testSpecificMock?.(mockServer, context)) ?? [];
        const bitcoinEndpoints = await mockBitcoinFixtureApis(mockServer, {
          localNodes: context.localNodes,
        });
        return [...customEndpoints, ...bitcoinEndpoints];
      },
    },
    testSuite,
  );
}

async function mockBitcoinFixtureApis(
  mockServer: Mockttp,
  { localNodes }: { localNodes: unknown[] },
): Promise<MockedEndpoint[]> {
  const bitcoinNode = localNodes.find(
    (node): node is BitcoinRegtestNode => node instanceof BitcoinRegtestNode,
  );
  if (!bitcoinNode) {
    throw new Error('Bitcoin regtest node was not started');
  }

  return [
    await mockExchangeRates(mockServer),
    await mockCurrencyExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockSolanaSpotPrices(mockServer),
    await mockSupportedVsCurrencies(mockServer),
    await mockPriceMulti(mockServer),
    await mockPriceMultiBtcAndSol(mockServer),
    ...(await proxyBitcoinBlockchainCalls(mockServer, bitcoinNode)),
  ];
}
