import { Mockttp } from 'mockttp';
import { CHAIN_IDS } from '../../../shared/constants/network';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { mockPriceApi } from '../tests/tokens/utils/mocks';

/** XDC mainnet chain id in hex, as stored in NetworkController fixtures. */
export const XDC_CHAIN_ID_HEX = CHAIN_IDS.XDC;

/** XDC mainnet chain id in decimal, as passed to Anvil via `localNodeOptions`. */
export const XDC_CHAIN_ID_DECIMAL = Number.parseInt(XDC_CHAIN_ID_HEX, 16);

/** CAIP-2 chain id for XDC, as keyed in NetworkEnablementController state. */
export const XDC_CAIP_CHAIN_ID = 'eip155:50';

/**
 * CAIP-19 asset id for native XDC.
 *
 * XDC's registered SLIP-44 coin type is 550, but the shared mocks use
 * `slip44:60` for every EVM chain except 1337, and `mockPriceApi` derives the
 * same id. Using 60 keeps this helper consistent with the mocks it builds on.
 *
 * Spelled out rather than interpolated so it keeps the literal type that
 * `nativeAssetIdentifiers` requires.
 */
export const XDC_NATIVE_ASSET_ID = 'eip155:50/slip44:60';

/**
 * `localNodeOptions` that run the local Anvil node on XDC's chain id. The node
 * still listens on the default port 8545, which is where
 * {@link getXdcChainFixtureBuilder} points the XDC RPC endpoint.
 *
 * `withFixtures` also threads this chain id into `setupMocking`, which retargets
 * the chain-parameterized gas, token and security-alert mocks to XDC.
 */
export const XDC_LOCAL_NODE_OPTIONS = [
  {
    type: 'anvil',
    options: {
      chainId: XDC_CHAIN_ID_DECIMAL,
    },
  },
];

/**
 * Builds a fixture with XDC selected and enabled, and its RPC endpoint pointed
 * at the local Anvil node. Returns the builder rather than a built fixture so
 * callers can chain additional state before calling `build()`.
 *
 * All three steps are required. `withNetworkControllerOnXdc` injects and selects
 * the network, since XDC ships in neither the default fixture nor its
 * `nativeAssetIdentifiers` map. `withEnabledNetworks` enables it, replacing the
 * map rather than merging. `withNetworkEnablementController` merges, so it adds
 * the native asset id the UI needs to resolve XDC's balance.
 *
 * Pair this with {@link XDC_LOCAL_NODE_OPTIONS} so the node's chain id matches
 * the network the extension believes it is on.
 */
export function getXdcChainFixtureBuilder(): FixtureBuilderV2 {
  return new FixtureBuilderV2()
    .withNetworkControllerOnXdc()
    .withEnabledNetworks({ eip155: { [XDC_CHAIN_ID_HEX]: true } })
    .withNetworkEnablementController({
      nativeAssetIdentifiers: {
        [XDC_CAIP_CHAIN_ID]: XDC_NATIVE_ASSET_ID,
      },
    });
}

/**
 * Mocks spot prices and exchange rates for native XDC.
 *
 * @param mockServer - Mockttp instance.
 * @param xdcPriceInUsd - Spot price for native XDC. Defaults to `MOCK_ETH_CONVERSION_RATE`.
 */
export async function mockXdcChainPriceApis(
  mockServer: Mockttp,
  xdcPriceInUsd?: number,
) {
  return mockPriceApi(mockServer, xdcPriceInUsd, XDC_CHAIN_ID_HEX);
}

/**
 * Supplies metadata for native XDC.
 *
 * The default `tokens.api.cx.metamask.io/v3/assets` handler in `mock-e2e.js`
 * only knows about mainnet and localhost native ETH plus a few mainnet ERC-20s,
 * and answers everything else with an empty array. Without a name, symbol and
 * decimals the asset cannot be rendered at all, so XDC would otherwise show a
 * zero balance and expose no `token-asset-0x32-XDC` entry in the send flow.
 *
 * Unrecognised asset ids keep returning an empty array, matching the default
 * handler this overrides.
 *
 * @param mockServer - Mockttp instance.
 */
export async function mockXdcNativeAssetMetadata(mockServer: Mockttp) {
  return mockServer
    .forGet('https://tokens.api.cx.metamask.io/v3/assets')
    .always()
    .thenCallback((request) => {
      const assetIds = new URL(request.url).searchParams
        .getAll('assetIds')
        .join(',');

      return {
        statusCode: 200,
        json: assetIds.includes(XDC_NATIVE_ASSET_ID)
          ? [
              {
                assetId: XDC_NATIVE_ASSET_ID,
                name: 'XDC Network',
                symbol: 'XDC',
                decimals: 18,
              },
            ]
          : [],
      };
    });
}

/**
 * Registers every network mock an XDC test needs. Pass directly as
 * `withFixtures({ testSpecificMock })`.
 *
 * @param mockServer - Mockttp instance.
 */
export async function mockXdcChainApis(mockServer: Mockttp) {
  return [
    ...(await mockXdcChainPriceApis(mockServer)),
    await mockXdcNativeAssetMetadata(mockServer),
  ];
}
