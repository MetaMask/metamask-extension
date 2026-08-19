import { MockedEndpoint, Mockttp } from 'mockttp';
import { DEFAULT_STELLAR_ADDRESS } from '../../../constants';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import { StellarNode } from '../../../seeder/stellar/node';
import { proxyStellarBlockchainCalls } from '../../../seeder/stellar/proxy';
import {
  STELLAR_BIP44_FLAGS,
  STELLAR_CHAIN_ID,
  STELLAR_MANIFEST_FLAGS,
  mockStellarFeatureFlags,
  mockStellarNativeTokenMetadata,
  mockStellarSpotPrices,
  mockStellarTokensApiByChainId,
} from '../mocks/common-stellar';

type WithFixturesOptions = Parameters<typeof withFixtures>[0];
type WithFixturesTestSuite = Parameters<typeof withFixtures>[1];

export type WithStellarFixtureOptions = Omit<
  WithFixturesOptions,
  'localNodeOptions'
> & {
  accounts?: string[];
};

/**
 * Starts `stellar/quickstart --local` in Docker via `withFixtures`, funds the
 * given accounts with Friendbot, and proxies Infura Horizon/RPC to that node.
 *
 * The wallet stays on built-in Stellar (`stellar:pubnet`). No custom network
 * or localhost RPC is added — the snap still calls Infura, and mockttp
 * forwards those requests to Quickstart.
 *
 * Tokens API, price, and feature-flag mocks stay in place — those are client
 * services, not the chain.
 *
 * @param options - Fixture options plus optional Friendbot accounts
 * @param testSuite - Test body
 */
export async function withStellarFixture(
  options: WithStellarFixtureOptions,
  testSuite: WithFixturesTestSuite,
): Promise<void> {
  const {
    accounts = [DEFAULT_STELLAR_ADDRESS],
    fixtures = buildDefaultStellarFixtures(),
    manifestFlags,
    testSpecificMock,
    ...withFixtureOptions
  } = options;

  let capturedLocalNodes: unknown[] = [];

  await withFixtures(
    {
      ...withFixtureOptions,
      fixtures,
      manifestFlags: {
        ...STELLAR_MANIFEST_FLAGS,
        ...manifestFlags,
        remoteFeatureFlags: {
          ...STELLAR_MANIFEST_FLAGS.remoteFeatureFlags,
          ...manifestFlags?.remoteFeatureFlags,
        },
      },
      localNodeOptions: [{ type: 'stellar' }],
      afterLocalNodesStart: async (context: { localNodes: unknown[] }) => {
        capturedLocalNodes = context.localNodes;
        const stellarNode = requireStellarNode(context.localNodes);
        for (const address of accounts) {
          await stellarNode.fundAccount(address);
        }
      },
      testSpecificMock: async (mockServer: Mockttp) => {
        const customEndpoints = (await testSpecificMock?.(mockServer)) ?? [];
        return [
          ...customEndpoints,
          ...(await mockStellarLocalNodeClientApis(
            mockServer,
            requireStellarNode(capturedLocalNodes),
          )),
        ];
      },
    },
    testSuite,
  );
}

function buildDefaultStellarFixtures() {
  return new FixtureBuilderV2()
    .withShowNativeTokenAsMainBalanceDisabled()
    .withRemoteFeatureFlagController({
      remoteFeatureFlags: {
        stellarAccounts: STELLAR_BIP44_FLAGS.stellarAccounts,
      },
    })
    // Full assignment: omit localhost (`0x539`) so Network Manager stays on
    // Popular instead of opening the Custom tab.
    .withEnabledNetworks({
      eip155: { '0x1': true },
      stellar: { [STELLAR_CHAIN_ID]: true },
    })
    .build();
}

async function mockStellarLocalNodeClientApis(
  mockServer: Mockttp,
  stellarNode: StellarNode,
): Promise<MockedEndpoint[]> {
  return [
    await mockStellarFeatureFlags(mockServer),
    await mockStellarNativeTokenMetadata(mockServer),
    await mockStellarTokensApiByChainId(mockServer),
    await mockStellarSpotPrices(mockServer),
    ...(await proxyStellarBlockchainCalls(mockServer, stellarNode)),
  ];
}

function requireStellarNode(localNodes: unknown[]): StellarNode {
  const stellarNode = localNodes.find(
    (node): node is StellarNode => node instanceof StellarNode,
  );
  if (!stellarNode) {
    throw new Error('Stellar local node was not started');
  }
  return stellarNode;
}
