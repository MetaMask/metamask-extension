import { Mockttp } from 'mockttp';
import { CHAIN_IDS } from '../../../shared/constants/network';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { mockPriceApi } from '../tests/tokens/utils/mocks';

/** Base mainnet chain id in hex, as stored in NetworkController fixtures. */
export const BASE_CHAIN_ID_HEX = CHAIN_IDS.BASE;

/** Base mainnet chain id in decimal, as passed to Anvil via `localNodeOptions`. */
export const BASE_CHAIN_ID_DECIMAL = Number.parseInt(BASE_CHAIN_ID_HEX, 16);

/** CAIP-19 asset id for native ETH on Base. */
export const BASE_NATIVE_ASSET_ID = `eip155:${BASE_CHAIN_ID_DECIMAL}/slip44:60`;

/**
 * `localNodeOptions` that run the local Anvil node on Base's chain id. The node
 * still listens on the default port 8545, which is where
 * {@link getBaseChainFixtureBuilder} points the Base RPC endpoint.
 *
 * `withFixtures` also threads this chain id into `setupMocking`, which retargets
 * the chain-parameterized gas, token and security-alert mocks to Base.
 */
export const BASE_LOCAL_NODE_OPTIONS = [
  {
    type: 'anvil',
    options: {
      chainId: BASE_CHAIN_ID_DECIMAL,
    },
  },
];

/**
 * Builds a fixture with Base selected and enabled, and its RPC endpoint pointed
 * at the local Anvil node. Returns the builder rather than a built fixture so
 * callers can chain additional state before calling `build()`.
 *
 * Both steps are required: `withNetworkRpcUrlOnLocalhost` selects Base and
 * redirects its RPC, while `withEnabledNetworks` enables it (Base is disabled in
 * the default fixture, and this setter replaces the map rather than merging).
 *
 * Pair this with {@link BASE_LOCAL_NODE_OPTIONS} so the node's chain id matches
 * the network the extension believes it is on.
 */
export function getBaseChainFixtureBuilder(): FixtureBuilderV2 {
  return new FixtureBuilderV2()
    .withNetworkRpcUrlOnLocalhost(BASE_CHAIN_ID_HEX)
    .withEnabledNetworks({ eip155: { [BASE_CHAIN_ID_HEX]: true } });
}

/**
 * Mocks spot prices and exchange rates for native ETH on Base.
 *
 * @param mockServer - Mockttp instance.
 * @param ethPriceInUsd - Spot price for native ETH on Base. Defaults to `MOCK_ETH_CONVERSION_RATE`.
 */
export async function mockBaseChainPriceApis(
  mockServer: Mockttp,
  ethPriceInUsd?: number,
) {
  return mockPriceApi(mockServer, ethPriceInUsd, BASE_CHAIN_ID_HEX);
}

/**
 * Supplies metadata for Base's native ETH.
 *
 * The default `tokens.api.cx.metamask.io/v3/assets` handler in `mock-e2e.js`
 * only knows about mainnet and localhost native ETH plus a few mainnet ERC-20s,
 * and answers everything else with an empty array. Without a name, symbol and
 * decimals the asset cannot be rendered at all, so Base would otherwise show a
 * zero balance and expose no `token-asset-0x2105-ETH` entry in the send flow.
 *
 * Unrecognised asset ids keep returning an empty array, matching the default
 * handler this overrides.
 *
 * @param mockServer - Mockttp instance.
 */
export async function mockBaseChainNativeAssetMetadata(mockServer: Mockttp) {
  return mockServer
    .forGet('https://tokens.api.cx.metamask.io/v3/assets')
    .always()
    .thenCallback((request) => {
      const assetIds = new URL(request.url).searchParams
        .getAll('assetIds')
        .join(',');

      return {
        statusCode: 200,
        json: assetIds.includes(BASE_NATIVE_ASSET_ID)
          ? [
              {
                assetId: BASE_NATIVE_ASSET_ID,
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
            ]
          : [],
      };
    });
}

/**
 * Registers every network mock a Base test needs. Pass directly as
 * `withFixtures({ testSpecificMock })`.
 *
 * @param mockServer - Mockttp instance.
 */
export async function mockBaseChainApis(mockServer: Mockttp) {
  return [
    ...(await mockBaseChainPriceApis(mockServer)),
    await mockBaseChainNativeAssetMetadata(mockServer),
  ];
}
