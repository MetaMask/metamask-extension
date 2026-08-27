import { Mockttp } from 'mockttp';
import type { Hex } from '@metamask/utils';
import type { NativeAssetIdentifiersMap } from '@metamask/network-enablement-controller';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { DEFAULT_FIXTURE_ACCOUNT_ID } from '../constants';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import {
  type CatalogAsset,
  type PriceMode,
  mockTokenAndPriceApis,
} from './token-price-mock-catalog';

export type CustomNetworkId =
  | 'xdc'
  | 'injective'
  | 'chiliz'
  | 'plasma'
  | 'rootstock'
  | 'hyperevm';

export type CustomNetworkScenario =
  | 'nativeSend'
  | 'nativeAndErc20'
  | 'dualNetworkWithErc20'
  | 'conversionRate'
  | 'unsupportedPrice';

export type CustomNetworkConfig = {
  id: CustomNetworkId;
  name: string;
  chainIdHex: Hex;
  chainIdDecimal: number;
  nativeSymbol: string;
  nativeAssetId: string;
  uiNativeAssetId: string;
  caipChainId: string;
  blockExplorerUrl: string;
  clientId: string;
  inDefaultFixture: boolean;
};

export const SEEDED_ERC20_SYMBOL = 'TST';

const SEEDED_ERC20_ADDRESS = '0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947';
const SEEDED_ERC20_ASSET_ID = `eip155:50/erc20:${SEEDED_ERC20_ADDRESS}`;
const MAINNET_NATIVE_ASSET_ID = 'eip155:1/slip44:60';
const MAINNET_CHAIN_ID_HEX = '0x1';

const CUSTOM_NETWORKS: Record<CustomNetworkId, CustomNetworkConfig> = {
  xdc: {
    id: 'xdc',
    name: 'XDC Network',
    chainIdHex: CHAIN_IDS.XDC,
    chainIdDecimal: 50,
    nativeSymbol: 'XDC',
    nativeAssetId: 'eip155:50/slip44:60',
    uiNativeAssetId: 'eip155:50/slip44:60',
    caipChainId: 'eip155:50',
    blockExplorerUrl: 'https://xdcscan.io',
    clientId: 'xdc-local',
    inDefaultFixture: false,
  },
  injective: {
    id: 'injective',
    name: 'Injective',
    chainIdHex: CHAIN_IDS.INJECTIVE,
    chainIdDecimal: 1776,
    nativeSymbol: 'INJ',
    nativeAssetId: 'eip155:1776/slip44:60',
    uiNativeAssetId: 'eip155:1776/slip44:22000119',
    caipChainId: 'eip155:1776',
    blockExplorerUrl: 'https://explorer.injective.network',
    clientId: 'injective-local',
    inDefaultFixture: false,
  },
  chiliz: {
    id: 'chiliz',
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
    inDefaultFixture: false,
  },
  plasma: {
    id: 'plasma',
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
    inDefaultFixture: false,
  },
  rootstock: {
    id: 'rootstock',
    name: 'Rootstock Mainnet',
    chainIdHex: CHAIN_IDS.ROOTSTOCK,
    chainIdDecimal: 30,
    nativeSymbol: 'RBTC',
    nativeAssetId: 'eip155:30/slip44:60',
    uiNativeAssetId: 'eip155:30/slip44:137',
    caipChainId: 'eip155:30',
    blockExplorerUrl: 'https://explorer.rsk.co',
    clientId: 'rootstock-local',
    inDefaultFixture: false,
  },
  hyperevm: {
    id: 'hyperevm',
    name: 'HyperEVM',
    chainIdHex: CHAIN_IDS.HYPE,
    chainIdDecimal: 999,
    nativeSymbol: 'HYPE',
    nativeAssetId: 'eip155:999/slip44:2457',
    uiNativeAssetId: 'eip155:999/slip44:2457',
    caipChainId: 'eip155:999',
    blockExplorerUrl: 'https://hyperevmscan.io/',
    clientId: 'hyperevm-local',
    inDefaultFixture: false,
  },
};

export const CONVERSION_RATE_NETWORKS: CustomNetworkId[] = [
  'injective',
  'chiliz',
  'plasma',
  'rootstock',
  'hyperevm',
];

export function getCustomNetwork(id: CustomNetworkId): CustomNetworkConfig {
  return CUSTOM_NETWORKS[id];
}

function nativeCatalogAsset(network: CustomNetworkConfig): CatalogAsset {
  return {
    name: network.name,
    symbol: network.nativeSymbol,
    decimals: 18,
    assetIds: [network.nativeAssetId, network.uiNativeAssetId],
    idPrefixes: [`${network.caipChainId}/`],
  };
}

function erc20CatalogAsset(): CatalogAsset {
  return {
    name: SEEDED_ERC20_SYMBOL,
    symbol: SEEDED_ERC20_SYMBOL,
    decimals: 4,
    priceInUsd: 1,
    assetIds: [SEEDED_ERC20_ASSET_ID],
  };
}

function mainnetNativeCatalogAsset(): CatalogAsset {
  return {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    assetIds: [MAINNET_NATIVE_ASSET_ID],
  };
}

function catalogAssetsFor(
  network: CustomNetworkConfig,
  scenario: CustomNetworkScenario,
): CatalogAsset[] {
  switch (scenario) {
    case 'nativeSend':
    case 'conversionRate':
    case 'unsupportedPrice':
      return [nativeCatalogAsset(network)];
    case 'nativeAndErc20':
      return [nativeCatalogAsset(network), erc20CatalogAsset()];
    case 'dualNetworkWithErc20':
      return [
        mainnetNativeCatalogAsset(),
        nativeCatalogAsset(network),
        erc20CatalogAsset(),
      ];
    default: {
      const exhaustive: never = scenario;
      throw new Error(`Unknown scenario: ${String(exhaustive)}`);
    }
  }
}

function priceModeFor(scenario: CustomNetworkScenario): PriceMode {
  switch (scenario) {
    case 'unsupportedPrice':
      return 'unsupported';
    case 'nativeSend':
    case 'nativeAndErc20':
    case 'dualNetworkWithErc20':
    case 'conversionRate':
      return 'quoted';
    default: {
      const exhaustive: never = scenario;
      throw new Error(`Unknown scenario: ${String(exhaustive)}`);
    }
  }
}

function assertScenarioSupportsNetwork(
  id: CustomNetworkId,
  scenario: CustomNetworkScenario,
): void {
  if (
    (scenario === 'nativeAndErc20' || scenario === 'dualNetworkWithErc20') &&
    id !== 'xdc'
  ) {
    throw new Error(`${scenario} is only defined for xdc, not ${id}`);
  }
}

function selectAndEnableNetwork(
  builder: FixtureBuilderV2,
  network: CustomNetworkConfig,
  enabledChainIds: Hex[],
): FixtureBuilderV2 {
  const withNetwork = network.inDefaultFixture
    ? builder.withNetworkRpcUrlOnLocalhost(network.chainIdHex)
    : builder.withNetworkControllerOnCustomNetwork({
        chainId: network.chainIdHex,
        clientId: network.clientId,
        name: network.name,
        nativeCurrency: network.nativeSymbol,
        blockExplorerUrl: network.blockExplorerUrl,
      });

  const enabledEip155 = Object.fromEntries(
    enabledChainIds.map((chainId) => [chainId, true]),
  );

  return withNetwork
    .withEnabledNetworks({ eip155: enabledEip155 })
    .withNetworkEnablementController({
      nativeAssetIdentifiers: {
        [network.caipChainId]: network.nativeAssetId,
      } as NativeAssetIdentifiersMap,
    });
}

function applyScenarioState(
  builder: FixtureBuilderV2,
  network: CustomNetworkConfig,
  scenario: CustomNetworkScenario,
): FixtureBuilderV2 {
  switch (scenario) {
    case 'nativeSend':
    case 'conversionRate':
    case 'unsupportedPrice':
      return builder.withAssetsController({
        assetsBalance: {
          [DEFAULT_FIXTURE_ACCOUNT_ID]: {
            [network.uiNativeAssetId]: { amount: '25' },
          },
        },
      });
    case 'nativeAndErc20':
      return builder.withTokensControllerERC20({
        chainId: network.chainIdDecimal,
      });
    case 'dualNetworkWithErc20':
      return builder
        .withTokensControllerERC20({
          chainId: network.chainIdDecimal,
        })
        .withAssetsController({
          assetsBalance: {
            [DEFAULT_FIXTURE_ACCOUNT_ID]: {
              [MAINNET_NATIVE_ASSET_ID]: { amount: '25' },
              [network.nativeAssetId]: { amount: '25' },
            },
          },
        });
    default: {
      const exhaustive: never = scenario;
      throw new Error(`Unknown scenario: ${String(exhaustive)}`);
    }
  }
}

export type CustomNetworkSetup = {
  fixtures: ReturnType<FixtureBuilderV2['build']>;
  localNodeOptions: { type: 'anvil'; options: { chainId: number } }[];
  testSpecificMock: (mockServer: Mockttp) => Promise<unknown[]>;
  network: CustomNetworkConfig;
};

/**
 * Builds fixtures, Anvil options, and Token/Price mocks for one custom
 * network scenario. Specs pass this bag to `withFixtures`.
 * @param id
 * @param scenario
 */
export function prepareCustomNetwork(
  id: CustomNetworkId,
  scenario: CustomNetworkScenario,
): CustomNetworkSetup {
  assertScenarioSupportsNetwork(id, scenario);
  const network = CUSTOM_NETWORKS[id];

  const enabledChainIds: Hex[] =
    scenario === 'dualNetworkWithErc20'
      ? [network.chainIdHex, MAINNET_CHAIN_ID_HEX]
      : [network.chainIdHex];

  const builder = applyScenarioState(
    selectAndEnableNetwork(new FixtureBuilderV2(), network, enabledChainIds),
    network,
    scenario,
  );

  const assets = catalogAssetsFor(network, scenario);
  const priceMode = priceModeFor(scenario);

  return {
    fixtures: builder.build(),
    localNodeOptions: [
      { type: 'anvil', options: { chainId: network.chainIdDecimal } },
    ],
    testSpecificMock: (mockServer: Mockttp) =>
      mockTokenAndPriceApis(mockServer, { assets, priceMode }),
    network,
  };
}
