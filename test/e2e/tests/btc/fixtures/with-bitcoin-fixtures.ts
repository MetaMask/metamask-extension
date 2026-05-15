import { MockedEndpoint, Mockttp } from 'mockttp';
import { DEFAULT_BTC_ADDRESS, DEFAULT_BTC_BALANCE } from '../../../constants';
import { withFixtures } from '../../../helpers';
import {
  BitcoinRegtestLocalNodeOptions,
  BitcoinRegtestNode,
  type EsploraTransaction,
  getScripthashForAddress,
} from '../../../seeder/bitcoin/node';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from '../mocks/min-api';
import {
  mockCurrencyExchangeRates,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
} from '../mocks/price-api';
import {
  type BitcoinFixtureBlockchainState,
  proxyBitcoinBlockchainCalls,
} from '../mocks/local-bitcoin-node-mocks';

type WithFixturesOptions = Parameters<typeof withFixtures>[0];
type WithFixturesTestSuite = Parameters<typeof withFixtures>[1];

export type BitcoinFixtureAccount = {
  address: string;
  balance?: number;
  transactions?: EsploraTransaction[];
};

export type WithBitcoinFixturesOptions = Omit<
  WithFixturesOptions,
  'localNodeOptions' | 'testSpecificMock'
> & {
  accounts?: BitcoinFixtureAccount[];
  dappOptions?: unknown;
  fixtures?: unknown;
  includeAnvil?: boolean;
  testSpecificMock?: (
    mockServer: Mockttp,
    context: { localNodes: unknown[] },
  ) => Promise<MockedEndpoint[]>;
  title?: string;
};

export function buildBitcoinNodeOptions(
  accounts: BitcoinFixtureAccount[] = [
    { address: DEFAULT_BTC_ADDRESS, balance: DEFAULT_BTC_BALANCE },
  ],
): BitcoinRegtestLocalNodeOptions {
  return {
    initialBalances: Object.fromEntries(
      accounts.map((account) => [
        account.address,
        account.balance ?? DEFAULT_BTC_BALANCE,
      ]),
    ),
  };
}

export function buildBitcoinFixtureBlockchainState(
  accounts: BitcoinFixtureAccount[] = [],
): BitcoinFixtureBlockchainState {
  const transactionHistoryByScripthash = new Map<
    string,
    EsploraTransaction[]
  >();
  const transactionsByTxid = new Map<string, EsploraTransaction>();

  for (const account of accounts) {
    if (account.transactions === undefined) {
      continue;
    }

    transactionHistoryByScripthash.set(
      getScripthashForAddress(account.address),
      account.transactions,
    );

    for (const transaction of account.transactions) {
      transactionsByTxid.set(transaction.txid, transaction);
    }
  }

  return {
    transactionHistoryByScripthash,
    transactionsByTxid,
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
          accounts,
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
  {
    accounts,
    localNodes,
  }: { accounts?: BitcoinFixtureAccount[]; localNodes: unknown[] },
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
    ...(await proxyBitcoinBlockchainCalls(
      mockServer,
      bitcoinNode,
      buildBitcoinFixtureBlockchainState(accounts),
    )),
  ];
}
