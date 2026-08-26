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
  /** Suite-owned Quickstart node started in Mocha `before`, stopped in `after`. */
  stellarNode: StellarNode;
};

/**
 * Runs a Stellar E2E against a suite-owned `stellar/quickstart` container.
 *
 * Docker start/stop is the spec's job (`before` / `after`). This helper only
 * Friendbot-funds the given accounts, then boots the wallet with Infura
 * Horizon/RPC proxied to that node. Client-service mocks (flags, tokens,
 * prices) stay in place — those are not the chain.
 *
 * @param options - Fixture options plus the running node and Friendbot accounts
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
    stellarNode,
    testSpecificMock,
    ...withFixtureOptions
  } = options;

  const fixtureMs = Date.now();
  await withFixtures(
    {
      ...withFixtureOptions,
      fixtures,
      // Node is already running; do not start Anvil or another Quickstart.
      localNodeOptions: [{ type: 'none' }],
      manifestFlags: {
        ...STELLAR_MANIFEST_FLAGS,
        ...manifestFlags,
        remoteFeatureFlags: {
          ...STELLAR_MANIFEST_FLAGS.remoteFeatureFlags,
          ...manifestFlags?.remoteFeatureFlags,
        },
      },
      afterLocalNodesStart: async () => {
        const fundMs = Date.now();
        for (const address of accounts) {
          await stellarNode.fundAccount(address);
        }
        console.log(
          `[stellar-fixture] friendbot ${accounts.length} account(s): ${elapsedSeconds(fundMs)}`,
        );
      },
      testSpecificMock: async (mockServer: Mockttp) => {
        const customEndpoints = (await testSpecificMock?.(mockServer)) ?? [];
        return [
          ...customEndpoints,
          ...(await mockStellarLocalNodeClientApis(mockServer, stellarNode)),
        ];
      },
    },
    testSuite,
  );
  console.log(
    `[stellar-fixture] withFixtures total: ${elapsedSeconds(fixtureMs)} (fund + browser + test body; docker start excluded)`,
  );
}

/**
 * Narrows the suite-owned node after Mocha `before`. Throws if `before`
 * skipped or failed to start.
 *
 * @param stellarNode - Node assigned in `before`, or undefined
 * @returns Started {@link StellarNode}
 */
export function requireSuiteStellarNode(
  stellarNode: StellarNode | undefined,
): StellarNode {
  if (!stellarNode) {
    throw new Error('Stellar local node was not started in before()');
  }
  return stellarNode;
}

function elapsedSeconds(startedAtMs: number): string {
  return `${((Date.now() - startedAtMs) / 1000).toFixed(2)}s`;
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
