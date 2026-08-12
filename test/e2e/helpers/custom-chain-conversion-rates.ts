import { Mockttp } from 'mockttp';
import type { Hex } from '@metamask/utils';
import type { NativeAssetIdentifiersMap } from '@metamask/network-enablement-controller';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { DEFAULT_FIXTURE_ACCOUNT_ID } from '../constants';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { MOCK_ETH_CONVERSION_RATE } from '../tests/tokens/utils/mocks';

/**
 * Configuration for one custom EVM chain covered by the conversion-rates spec.
 *
 * `caipChainId`, `nativeAssetId` and `uiNativeAssetId` are spelled out as
 * literal strings (not interpolated from `chainIdDecimal`) so they keep the
 * literal template types that `nativeAssetIdentifiers` requires.
 */
export type ChainConfig = {
  /** Display name shown in the network picker and token list. */
  name: string;
  /** Hex chain id, as stored in NetworkController fixtures. */
  chainIdHex: Hex;
  /** Decimal chain id, passed to Anvil via `localNodeOptions`. */
  chainIdDecimal: number;
  /** Native currency ticker (e.g. `INJ`). */
  nativeSymbol: string;
  /**
   * CAIP-19 asset id used in the `nativeAssetIdentifiers` map. Spelled as a
   * literal so it keeps the `${CaipChainId}/slip44:${number}` template type
   * the map requires. Always uses `slip44:60` (the EVM default) since the
   * `NativeAssetIdentifier` type only accepts the `slip44` namespace.
   */
  nativeAssetId: string;
  /**
   * The exact CAIP-19 asset id the UI actually requests for the native asset
   * (metadata, spot price and balance). The unified-assets layer derives this
   * from the network's `nativeCurrency` symbol via the `@metamask/slip44`
   * package: symbols with a registered SLIP-44 coin type resolve to
   * `slip44:<coinType>` (e.g. `INJ` -> `slip44:22000119`, `RBTC` ->
   * `slip44:137`); symbols without one fall back to the zero-address ERC-20
   * (`erc20:0x000…000`). The default Accounts API v5 balance mock returns
   * the native balance under `slip44:60`, which does NOT match this id for
   * most chains, so the native balance must be seeded under this id via
   * `withAssetsController` instead.
   */
  uiNativeAssetId: string;
  /** CAIP-2 chain id, as a literal string. */
  caipChainId: string;
  /** Block explorer URL for the chain. */
  blockExplorerUrl: string;
  /** Network client id used as the rpc endpoint key. */
  clientId: string;
  /**
   * `localNodeOptions` that run the local Anvil node on this chain's id. The
   * node still listens on port 8545, which is where the fixture's RPC endpoint
   * points.
   */
  localNodeOptions: { type: 'anvil'; options: { chainId: number } }[];
};

/**
 * The four custom EVM chains covered by the conversion-rates spec.
 *
 * All four are absent from the default fixture, so each needs its network
 * config injected (via `withNetworkControllerOnCustomNetwork`) and its native
 * asset identifier declared (via `withNetworkEnablementController`) before the
 * UI can resolve the native balance and render the token row.
 */
export const CHAIN_CONFIGS: ChainConfig[] = [
  {
    name: 'Injective',
    chainIdHex: CHAIN_IDS.INJECTIVE,
    chainIdDecimal: 1776,
    nativeSymbol: 'INJ',
    nativeAssetId: 'eip155:1776/slip44:60',
    uiNativeAssetId: 'eip155:1776/slip44:22000119',
    caipChainId: 'eip155:1776',
    blockExplorerUrl: 'https://explorer.injective.network',
    clientId: 'injective-local',
    localNodeOptions: [{ type: 'anvil', options: { chainId: 1776 } }],
  },
  {
    name: 'Chiliz',
    chainIdHex: CHAIN_IDS.CHZ,
    chainIdDecimal: 88888,
    nativeSymbol: 'CHZ',
    nativeAssetId: 'eip155:88888/slip44:60',
    uiNativeAssetId:
      'eip155:88888/erc20:0x0000000000000000000000000000000000000000',
    caipChainId: 'eip155:88888',
    blockExplorerUrl: 'https://chiliscan.com',
    clientId: 'chiliz-local',
    localNodeOptions: [{ type: 'anvil', options: { chainId: 88888 } }],
  },
  {
    name: 'Plasma',
    chainIdHex: CHAIN_IDS.PLASMA,
    chainIdDecimal: 9745,
    nativeSymbol: 'XPL',
    nativeAssetId: 'eip155:9745/slip44:60',
    uiNativeAssetId:
      'eip155:9745/erc20:0x0000000000000000000000000000000000000000',
    caipChainId: 'eip155:9745',
    blockExplorerUrl: 'https://plasmascan.com',
    clientId: 'plasma-local',
    localNodeOptions: [{ type: 'anvil', options: { chainId: 9745 } }],
  },
  {
    name: 'Rootstock Mainnet',
    chainIdHex: CHAIN_IDS.ROOTSTOCK,
    chainIdDecimal: 30,
    nativeSymbol: 'RBTC',
    nativeAssetId: 'eip155:30/slip44:60',
    uiNativeAssetId: 'eip155:30/slip44:137',
    caipChainId: 'eip155:30',
    blockExplorerUrl: 'https://explorer.rsk.co',
    clientId: 'rootstock-local',
    localNodeOptions: [{ type: 'anvil', options: { chainId: 30 } }],
  },
  {
    name: 'HyperEVM',
    chainIdHex: CHAIN_IDS.HYPE,
    chainIdDecimal: 999,
    nativeSymbol: 'HYPE',
    nativeAssetId: 'eip155:999/slip44:2457',
    uiNativeAssetId: 'eip155:999/slip44:2457',
    caipChainId: 'eip155:999',
    blockExplorerUrl: 'https://hyperevmscan.io/',
    clientId: 'hyperevm-local',
    localNodeOptions: [{ type: 'anvil', options: { chainId: 999 } }],
  },
];

/**
 * Builds a fixture with the given custom chain selected and enabled, and its
 * native asset identifier declared. Returns the builder rather than a built
 * fixture so callers can chain additional state before calling `build()`.
 *
 * All three steps are required. `withNetworkControllerOnCustomNetwork` injects
 * and selects the network since these chains ship in neither the default
 * fixture nor its `nativeAssetIdentifiers` map. `withEnabledNetworks` enables
 * the chain, replacing the map rather than merging. `withNetworkEnablementController`
 * merges, so it adds the native asset id the UI needs to resolve the balance.
 *
 * The native balance is seeded under `config.uiNativeAssetId` via
 * `withAssetsController`. The unified-assets layer derives the native asset id
 * from the network's `nativeCurrency` symbol via the `@metamask/slip44`
 * package (e.g. `INJ` -> `slip44:22000119`, `RBTC` -> `slip44:137`,
 * falling back to the zero-address ERC-20 for symbols without a registered
 * coin type). The default Accounts API v5 balance mock returns the native
 * balance under `slip44:60`, which does not match the UI's id for most
 * chains, so seeding the balance under `uiNativeAssetId` is required for the
 * token row to render with a non-zero balance.
 *
 * Pair this with `config.localNodeOptions` so the Anvil node's chain id matches
 * the network the extension believes it is on.
 *
 * @param config - The chain to build a fixture for.
 * @returns A `FixtureBuilderV2` for further chaining.
 */
export function getCustomChainFixtureBuilder(config: ChainConfig): FixtureBuilderV2 {
  return new FixtureBuilderV2()
    .withNetworkControllerOnCustomNetwork({
      chainId: config.chainIdHex,
      clientId: config.clientId,
      name: config.name,
      nativeCurrency: config.nativeSymbol,
      blockExplorerUrl: config.blockExplorerUrl,
    })
    .withEnabledNetworks({ eip155: { [config.chainIdHex]: true } })
    .withNetworkEnablementController({
      nativeAssetIdentifiers: {
        [config.caipChainId]: config.nativeAssetId,
      } as NativeAssetIdentifiersMap,
    })
    .withAssetsController({
      assetsBalance: {
        [DEFAULT_FIXTURE_ACCOUNT_ID]: {
          [config.uiNativeAssetId]: { amount: '25' },
        },
      },
    });
}

/**
 * Registers every network mock a custom-chain conversion-rates test needs.
 * Pass directly as `withFixtures({ testSpecificMock })` wrapped with the chain
 * config: `testSpecificMock: (server) => mockChainConversionRateApis(server, config)`.
 *
 * Uses a SINGLE `v3/assets` handler and a SINGLE `v3/spot-prices` handler. Two
 * `always()` handlers on the same URL cause mockttp to match the first one
 * every time and silently drop the second, so the native asset metadata and
 * spot price must each be served from one handler rather than combining
 * separate per-concern handlers.
 *
 * The handlers match by CAIP-2 chain prefix (e.g. `eip155:1776/`) rather than
 * the full asset id. The NetworkEnablementController derives the native asset
 * id's slip44 segment at runtime from chainid.network data, so the exact id the
 * UI requests (e.g. `eip155:1776/slip44:22000119`) is not known at fixture-build
 * time. Matching on the chain prefix keeps the mock correct regardless of the
 * derived slip44.
 *
 * @param mockServer - Mockttp instance.
 * @param config - The chain to mock APIs for.
 * @param priceInUsd - Spot price for the chain's native asset. Defaults to
 * `MOCK_ETH_CONVERSION_RATE`.
 */
export async function mockChainConversionRateApis(
  mockServer: Mockttp,
  config: ChainConfig,
  priceInUsd?: number,
) {
  const resolvedPrice = priceInUsd ?? MOCK_ETH_CONVERSION_RATE;
  // Prefix that identifies any native asset id on this chain, e.g.
  // `eip155:1776/`. The trailing slash avoids matching a chain id that is a
  // prefix of another (e.g. `eip155:1` vs `eip155:1776`).
  const nativeAssetPrefix = `${config.caipChainId}/`;

  const spotPricesMock = await mockServer
    .forGet(/^https:\/\/price\.api\.cx\.metamask\.io\/v3\/spot-prices/u)
    .always()
    .thenCallback((request) => {
      const url = new URL(request.url);
      const requestedAssetIds = url.searchParams.getAll('assetIds');
      const json: Record<
        string,
        {
          id: string;
          price: number;
          marketCap: number;
          totalVolume: number;
          dilutedMarketCap: number;
          pricePercentChange1d: number;
        }
      > = {};
      for (const assetId of requestedAssetIds) {
        if (assetId.startsWith(nativeAssetPrefix)) {
          json[assetId] = {
            id: config.clientId,
            price: resolvedPrice,
            marketCap: 112500000,
            totalVolume: 4500000,
            dilutedMarketCap: 120000000,
            pricePercentChange1d: 0,
          };
        }
      }
      return { statusCode: 200, json };
    });

  const exchangeRatesMock = await mockServer
    .forGet('https://price.api.cx.metamask.io/v1/exchange-rates')
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        eth: {
          name: 'Ether',
          ticker: 'eth',
          value: 1 / MOCK_ETH_CONVERSION_RATE,
          currencyType: 'crypto',
        },
        usd: {
          name: 'US Dollar',
          ticker: 'usd',
          value: 1,
          currencyType: 'fiat',
        },
      },
    }));

  const assetsMetadataMock = await mockServer
    .forGet('https://tokens.api.cx.metamask.io/v3/assets')
    .always()
    .thenCallback((request) => {
      const assetIds = new URL(request.url).searchParams
        .getAll('assetIds')
        .join(',');

      // Match any native asset id on this chain (the slip44 segment is
      // derived at runtime, so match on the chain prefix).
      const nativeMatch = assetIds
        .split(',')
        .some((assetId) => assetId.startsWith(nativeAssetPrefix));

      return {
        statusCode: 200,
        json: nativeMatch
          ? [
              {
                // Echo back the first matching requested asset id so the UI
                // can correlate the metadata with its request.
                assetId:
                  assetIds
                    .split(',')
                    .find((assetId) => assetId.startsWith(nativeAssetPrefix)) ??
                  config.nativeAssetId,
                name: config.name,
                symbol: config.nativeSymbol,
                decimals: 18,
              },
            ]
          : [],
      };
    });

  return [spotPricesMock, exchangeRatesMock, assetsMetadataMock];
}
