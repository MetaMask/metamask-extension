import { MockedEndpoint, Mockttp } from 'mockttp';
import type { ManifestFlags } from '../../../../../shared/lib/manifestFlags';
import { DEFAULT_BTC_BALANCE } from '../../../constants';
import { withFixtures } from '../../../helpers';
import {
  BitcoinLocalNodeOptions,
  BitcoinNode,
} from '../../../seeder/bitcoin/node';
import {
  mockCurrencyExchangeRates,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockInitialFullScan,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
  mockTokensV2SupportedNetworks,
  mockTokensV3Assets,
} from '../mocks';
import { proxyBitcoinBlockchainCalls } from '../mocks/local-bitcoin-node-mocks';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from '../mocks/min-api';

type WithFixturesOptions = Parameters<typeof withFixtures>[0];
type WithFixturesTestSuite = Parameters<typeof withFixtures>[1];

export type WithBitcoinFixturesOptions = Omit<
  WithFixturesOptions,
  'localNodeOptions' | 'testSpecificMock' | 'afterLocalNodesStart'
> & {
  bitcoinNodeOptions?: BitcoinLocalNodeOptions;
  /** Use static blockchain data only for deterministic form/review assertions. */
  localNode?: boolean;
  // helpers.js only declares `options` as object, so expose these explicitly.
  fixtures?: unknown;
  dappOptions?: { numberOfTestDapps: number };
  title?: string;
  ignoredConsoleErrors?: string[];
  manifestFlags?: ManifestFlags;
  afterLocalNodesStart?: (context: {
    localNodes: unknown[];
  }) => Promise<void> | void;
  testSpecificMock?: (
    mockServer: Mockttp,
    context: { localNodes: unknown[] },
  ) => Promise<MockedEndpoint[]>;
};

/**
 * Starts an isolated Bitcoin node and mocks external services, like the Tron
 * fixture wrapper. Static blockchain data is opt-in for exact review values.
 *
 * @param options - Fixture setup and optional Bitcoin node configuration.
 * @param testSuite - Scenario executed by the fixture harness.
 */
export async function withBitcoinFixtures(
  options: WithBitcoinFixturesOptions,
  testSuite: WithFixturesTestSuite,
): Promise<void> {
  const {
    bitcoinNodeOptions,
    localNode = true,
    afterLocalNodesStart,
    testSpecificMock,
    ...fixtureOptions
  } = options;
  let localNodes: unknown[] = [];

  await withFixtures(
    {
      ...fixtureOptions,
      localNodeOptions: [
        'anvil',
        ...(localNode
          ? [
              {
                type: 'bitcoin' as const,
                options: {
                  initialBalance: DEFAULT_BTC_BALANCE,
                  ...bitcoinNodeOptions,
                },
              },
            ]
          : []),
      ],
      afterLocalNodesStart: async (context: { localNodes: unknown[] }) => {
        localNodes = context.localNodes;
        await afterLocalNodesStart?.(context);
      },
      testSpecificMock: async (mockServer: Mockttp) => {
        const customEndpoints =
          (await testSpecificMock?.(mockServer, { localNodes })) ?? [];
        const bitcoinNode = localNodes.find(
          (node): node is BitcoinNode => node instanceof BitcoinNode,
        );
        if (localNode && !bitcoinNode) {
          throw new Error('Bitcoin local node was not started');
        }

        const blockchainEndpoints = bitcoinNode
          ? await proxyBitcoinBlockchainCalls(mockServer, bitcoinNode)
          : [];
        if (!bitcoinNode) {
          await mockInitialFullScan(mockServer);
        }

        return [
          ...customEndpoints,
          await mockExchangeRates(mockServer),
          await mockCurrencyExchangeRates(mockServer),
          await mockFiatExchangeRates(mockServer),
          await mockSolanaSpotPrices(mockServer),
          await mockSupportedVsCurrencies(mockServer),
          await mockPriceMulti(mockServer),
          await mockPriceMultiBtcAndSol(mockServer),
          ...(await mockTokensV2SupportedNetworks(mockServer)),
          await mockTokensV3Assets(mockServer),
          ...blockchainEndpoints,
        ];
      },
    },
    testSuite,
  );
}
