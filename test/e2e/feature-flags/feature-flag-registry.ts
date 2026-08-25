/**
 * Feature Flag Registry
 *
 * Central source of truth for all feature flags used in MetaMask Extension.
 * This registry tracks every remote feature flag with its production default
 * value, so E2E tests run against production-accurate flag configurations
 * unless a test explicitly overrides a specific flag.
 *
 * The global E2E mock (mock-e2e.js) reads from this registry to return
 * production-accurate values when the extension fetches flags at runtime.
 *
 * To override a flag in a test, use:
 * - `manifestFlags: { remoteFeatureFlags: { flagName: value } }` (runtime override)
 * - `FixtureBuilder.withRemoteFeatureFlags({ flagName: value })` (fixture state)
 *
 * @see {@link https://client-config.api.cx.metamask.io/v1/flags?client=extension&distribution=main&environment=prod}
 */

import type { Json } from '@metamask/utils';
import { ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG } from '../../../shared/lib/gator-permissions/feature-flags';
import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import { ACTIVE_TAB_DOMAIN_METRICS_FLAG } from '../../../shared/lib/active-tab-domain-metrics';
import {
  MONEY_EARNING_SECTION_ENABLED_FLAG_NAME,
  MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME,
} from '../../../shared/lib/money/feature-flags';

// ============================================================================
// Types
// ============================================================================

/**
 * Lifecycle status of a feature flag.
 */
export enum FeatureFlagStatus {
  /** Flag is actively used in production */
  Active = 'active',
  /** Flag is scheduled for removal */
  Deprecated = 'deprecated',
}

/**
 * Where the feature flag originates.
 */
export enum FeatureFlagType {
  /** Fetched from the client-config API at runtime */
  Remote = 'remote',
  /** Set at compile time via .metamaskrc / builds.yml environment variables */
  Build = 'build',
}

/**
 * A single entry in the feature flag registry.
 */
export type FeatureFlagRegistryEntry = {
  name: string;
  type: FeatureFlagType;
  inProd: boolean;
  productionDefault: Json;
  status: FeatureFlagStatus;
};

// ============================================================================
// Registry
// ============================================================================

/**
 * The feature flag registry.
 *
 * Each entry maps a flag name to its metadata and production default value.
 * Remote flag values are stored in the exact format returned by the production
 * client-config API, so they can be served directly by mock-e2e.js.
 *
 * Production defaults last synced: 2026-08-18
 * Source: https://client-config.api.cx.metamask.io/v1/flags?client=extension&distribution=main&environment=prod
 */
/* eslint-disable @typescript-eslint/naming-convention -- production API flag names */
export const FEATURE_FLAG_REGISTRY: Record<string, FeatureFlagRegistryEntry> = {
  addBitcoinAccount: {
    inProd: true,
    name: 'addBitcoinAccount',
    productionDefault: false,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  addBitcoinAccountDummyFlag: {
    inProd: true,
    name: 'addBitcoinAccountDummyFlag',
    productionDefault: false,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  additionalNetworksBlacklist: {
    inProd: true,
    name: 'additionalNetworksBlacklist',
    productionDefault: ['0x13b2'],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  addSolanaAccount: {
    inProd: true,
    name: 'addSolanaAccount',
    productionDefault: true,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  assetsAccountApiBalances: {
    inProd: true,
    name: 'assetsAccountApiBalances',
    productionDefault: [
      '0x1',
      '0xe708',
      '0x38',
      '0x89',
      '0x2105',
      '0xa',
      '0xa4b1',
    ],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  assetsAccountsApiV6: {
    inProd: true,
    name: 'assetsAccountsApiV6',
    productionDefault: [
      {
        name: 'feature is ON',
        scope: {
          type: 'threshold',
          value: 0,
        },
        value: true,
      },
      {
        name: 'feature is OFF',
        scope: {
          type: 'threshold',
          value: 1,
        },
        value: false,
      },
    ],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  assetsDefiPositionsEnabled: {
    inProd: true,
    name: 'assetsDefiPositionsEnabled',
    productionDefault: true,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  assetsEnableNotificationsByDefault: {
    inProd: true,
    name: 'assetsEnableNotificationsByDefault',
    productionDefault: false,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  assetsEnableNotificationsByDefaultV2: {
    inProd: true,
    name: 'assetsEnableNotificationsByDefaultV2',
    productionDefault: [
      {
        name: 'feature is ON',
        scope: {
          type: 'threshold',
          value: 1,
        },
        value: true,
      },
      {
        name: 'feature is OFF',
        scope: {
          type: 'threshold',
          value: 0,
        },
        value: false,
      },
    ],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  assetsUnifyState: {
    inProd: true,
    name: 'assetsUnifyState',
    productionDefault: {
      versions: {
        '13.15.0': {
          deprecatedControllers: [],
          enabled: false,
          featureVersion: null,
          minimumVersion: null,
        },
        '13.37.0': {
          deprecatedControllers: ['TokenListController'],
          enabled: true,
          featureVersion: '1',
          minimumVersion: '13.38.0',
        },
        '13.42.0': {
          deprecatedControllers: ['TokenListController'],
          enabled: true,
          featureVersion: '1',
          minimumVersion: '13.38.0',
          tracesEnabled: false,
        },
      },
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  backendWebSocketConnection: {
    inProd: true,
    name: 'backendWebSocketConnection',
    productionDefault: [
      {
        name: 'feature is ON',
        scope: {
          type: 'threshold',
          value: 1,
        },
        value: true,
      },
      {
        name: 'feature is OFF',
        scope: {
          type: 'threshold',
          value: 0,
        },
        value: false,
      },
    ],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  batchSell: {
    inProd: true,
    name: 'batchSell',
    productionDefault: {
      versions: {},
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  bitcoinAccounts: {
    inProd: true,
    name: 'bitcoinAccounts',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.9.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  bitcoinTestnetsEnabled: {
    inProd: true,
    name: 'bitcoinTestnetsEnabled',
    productionDefault: false,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  bridgeConfig: {
    inProd: true,
    name: 'bridgeConfig',
    productionDefault: {
      bip44DefaultPairs: {
        bip122: {
          other: {},
          standard: {
            'bip122:000000000019d6689c085ae165831e93/slip44:0':
              'eip155:1/slip44:60',
          },
        },
        eip155: {
          other: {},
          standard: {
            'eip155:1/slip44:60':
              'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          },
        },
        solana: {
          other: {},
          standard: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501':
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          },
        },
      },
      chainRanking: [
        {
          chainId: 'eip155:1',
          name: 'Ethereum',
        },
        {
          chainId: 'eip155:56',
          name: 'BNB Chain',
        },
        {
          chainId: 'eip155:4663',
          name: 'Robinhood',
        },
        {
          chainId: 'bip122:000000000019d6689c085ae165831e93',
          name: 'BTC',
        },
        {
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          name: 'Solana',
        },
        {
          chainId: 'tron:728126428',
          name: 'Tron',
        },
        {
          chainId: 'eip155:8453',
          name: 'Base',
        },
        {
          chainId: 'eip155:42161',
          name: 'Arbitrum',
        },
        {
          chainId: 'eip155:59144',
          name: 'Linea',
        },
        {
          chainId: 'eip155:137',
          name: 'Polygon',
        },
        {
          chainId: 'eip155:43114',
          name: 'Avalanche',
        },
        {
          chainId: 'eip155:10',
          name: 'Optimism',
        },
        {
          chainId: 'eip155:143',
          name: 'Monad',
        },
        {
          chainId: 'eip155:1329',
          name: 'Sei',
        },
        {
          chainId: 'eip155:4326',
          name: 'MegaETH',
        },
        {
          chainId: 'eip155:999',
          name: 'HyperEVM',
        },
        {
          chainId: 'eip155:324',
          name: 'zkSync Era',
        },
      ],
      chains: {
        '1': {
          batchSellDestStablecoins: [
            'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            'eip155:1/erc20:0xdac17f958d2ee523a2206206994597c13d831ec7',
          ],
          isActiveDest: true,
          isActiveSrc: true,
          isGaslessSwapEnabled: true,
          isSingleSwapBridgeButtonEnabled: true,
          noFeeAssets: [],
          stablecoins: [
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            '0xdac17f958d2ee523a2206206994597c13d831ec7',
          ],
          topAssets: ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'],
        },
        '10': {
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: [
            '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
            '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
            '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
          ],
        },
        '56': {
          batchSellDestStablecoins: [
            'eip155:56/erc20:0x55d398326f99059ff775485246999027b3197955',
          ],
          isActiveDest: true,
          isActiveSrc: true,
          isGaslessSwapEnabled: true,
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: [
            '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
            '0x55d398326f99059ff775485246999027b3197955',
          ],
        },
        '137': {
          batchSellDestStablecoins: [
            'eip155:137/erc20:0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          ],
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: [
            '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
            '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
            '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
          ],
        },
        '143': {
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
        },
        '324': {
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: [
            '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4',
            '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4',
            '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C',
          ],
        },
        '999': {
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: ['0xb88339CB7199b77E23DB6E890353E22632Ba630f'],
        },
        '1329': {
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: ['0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1'],
        },
        '4326': {
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: ['0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb'],
        },
        '4663': {
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
          topAssets: [
            '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
            '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168',
          ],
        },
        '8453': {
          batchSellDestStablecoins: [
            'eip155:8453/erc20:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          ],
          isActiveDest: true,
          isActiveSrc: true,
          isGaslessSwapEnabled: true,
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'],
        },
        '42161': {
          batchSellDestStablecoins: [
            'eip155:42161/erc20:0xaf88d065e77c8cc2239327c5edb3a432268e5831',
          ],
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: [
            '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
            '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
          ],
        },
        '43114': {
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: [
            '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
            '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
            '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
            '0xc7198437980c041c805a1edcba50c1ce5db95118',
          ],
        },
        '59144': {
          batchSellDestStablecoins: [
            'eip155:59144/erc20:0xaca92e438df0b2401ff60da7e4337b687a2435da',
          ],
          isActiveDest: true,
          isActiveSrc: true,
          isGaslessSwapEnabled: true,
          isSingleSwapBridgeButtonEnabled: true,
          noFeeAssets: [],
          stablecoins: [
            '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
            '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
          ],
          topAssets: ['0x176211869ca2b568f2a7d4ee941e073a821ee1ff'],
        },
        '728126428': {
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
        },
        '1151111081099710': {
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
          isSnapConfirmationEnabled: true,
          refreshRate: 10000,
          topAssets: [
            'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
            'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
            '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxsDx8F8k8k3uYw1PDC',
            '3iQL8BFS2vE7mww4ehAqQHAsbmRNCrPxizWAT2Zfyr9y',
            '9zNQRsGLjNKwCUU5Gq5LR8beUCPzQMVMqKAi3SSZh54u',
            'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
            'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
            '21AErpiB8uSb94oQKRcwuHqyHF93njAxBSbdUrpupump',
            'pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn',
          ],
        },
        '20000000000001': {
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
        },
      },
      maxRefreshCount: 5,
      minimumVersion: '0.0.0',
      priceImpactThreshold: {
        gasless: 0.2,
        normal: 0.05,
      },
      refreshRate: 30000,
      sse: {
        enabled: true,
        minimumVersion: '13.9.0',
      },
      stablecoins: [
        'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        'eip155:1/erc20:0xdac17f958d2ee523a2206206994597c13d831ec7',
        'eip155:59144/erc20:0x176211869ca2b568f2a7d4ee941e073a821ee1ff',
        'eip155:59144/erc20:0xa219439258ca9da29e9cc4ce5596924745e12b93',
        'eip155:137/erc20:0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
        'eip155:137/erc20:0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
        'eip155:137/erc20:0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
        'eip155:42161/erc20:0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        'eip155:42161/erc20:0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
        'eip155:42161/erc20:0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        'eip155:8453/erc20:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        'eip155:10/erc20:0x0b2c639c533813f4aa9d7837caf62653d097ff85',
        'eip155:10/erc20:0x7f5c764cbc14f9669b88837ca1490cca17c31607',
        'eip155:10/erc20:0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
        'eip155:56/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        'eip155:56/erc20:0x55d398326f99059ff775485246999027b3197955',
        'eip155:43114/erc20:0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
        'eip155:43114/erc20:0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
        'eip155:43114/erc20:0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
        'eip155:43114/erc20:0xc7198437980c041c805a1edcba50c1ce5db95118',
        'eip155:324/erc20:0x1d17cbcf0d6d143135ae902365d2e5e2a16538d4',
        'eip155:324/erc20:0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4',
        'eip155:324/erc20:0x493257fd37edb34451f62edf8d2a0c418852ba4c',
        'eip155:1329/erc20:0x3894085ef7ff0f0aedf52e2a2704928d1ec074f1',
        'eip155:4326/erc20:0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
        'eip155:999/erc20:0xb88339cb7199b77e23db6e890353e22632ba630f',
        'eip155:4663/erc20:0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34',
        'eip155:4663/erc20:0x5fc5360d0400a0fd4f2af552add042d716f1d168',
      ],
      support: true,
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  bridgeQuoteStatusManager: {
    inProd: true,
    name: 'bridgeQuoteStatusManager',
    productionDefault: {
      versions: {
        '13.39.0': {
          enabled: true,
        },
      },
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  carouselBanners: {
    inProd: true,
    name: 'carouselBanners',
    productionDefault: true,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  cashtagInjection: {
    inProd: true,
    name: 'cashtagInjection',
    productionDefault: {
      enabled: false,
      minimumVersion: '13.42.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  complianceEnabled: {
    inProd: true,
    name: 'complianceEnabled',
    productionDefault: {
      enabled: false,
      minimumVersion: '0.0.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  configRegistryApiEnabled: {
    inProd: true,
    name: 'configRegistryApiEnabled',
    productionDefault: false,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  confirmations_eip_7702: {
    inProd: true,
    name: 'confirmations_eip_7702',
    productionDefault: {
      contracts: {
        '0x1': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Mainnet',
            signature:
              '0xffb37facfedf12f1e98b56203de1c855391b791a20ee361234c546f4b50eb11853283cfc311419049f0325ad0a806ec232cc519073e3b5d4ad59ff331964d2e71b',
          },
        ],
        '0x1012': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Citrea',
            signature:
              '0x6818c8c50d25e23dd3810758f3fc45d41c5444bec8fe0983660387414fab00366f6d8a0462b2e8985c16cdff5898d6bf9787e255b1a668d083728b448a5c3f641c',
          },
        ],
        '0x1079': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Tempo',
            signature:
              '0x810496170fb570d0d976c58273ad4a423252bac1f2e10c8a63adbbbfc4e79d2c5d894bae20c28e90a577338e68506138ac6dea142a1e80a31c0c2dd2999efa651b',
          },
        ],
        '0x13882': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Polygon Amoy Testnet',
            signature:
              '0x472bb78ebb6686ddf0bb2e75265e1f4266cd050f8b498e88f97e9380afd8bfbd169c4d3221ec8845cb81ba7e9ddb7de9b819a15617803e20aee2aaa07664b6c81b',
          },
        ],
        '0x138c5': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Berachain Testnet',
            signature:
              '0x66940bcb2c4b95ec2c1c1024fee1e3a8e51c8f072a52a9f0252a793604c8a6ba58ac3153d4dd041873d33eec349450c4a9acd51ddaed117bee448ed7a388208c1b',
          },
        ],
        '0x138de': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Berachain',
            signature:
              '0x2c2037ddedcdfb9b7d8ea7c546259eef371a86b0e3610192eb15ece0114c59d86134791cd9e9df4208bbbdc83776d80b30b1fea6bf1a05bb072575217492497a1b',
          },
        ],
        '0x13fb': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Citrea Testnet',
            signature:
              '0xf9e4aa35fc098468212352c2b9662022f9565bd713ca66e634c804f9820b5e0c266d710afba58aed00e5b7e24134dd9b52e2e331076de745137531a6d245a7521b',
          },
        ],
        '0x14a34': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Base Sepolia',
            signature:
              '0xaed94ac035e745629423c547200eb2411fd7194d832a6b4cf459d3e3d34a6b62124e88640a0bf623146bdef63b0ce1c8797bd2a6c8357fab86c8be466744f55d1c',
          },
        ],
        '0x152': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Cronos Testnet',
            signature:
              '0x8fec0190a311f6ba5dc9df8d76fef3673e6c4081c087f779bca7e3247bb40a5070d393d29c6b268deb3fa231a138b7914b25395cd6dec0fdf4b2b7701975e78b1c',
          },
        ],
        '0x18c6': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'MegaEth Testnet',
            signature:
              '0x6743135a8dfc8f58133d827b4997bc5316c8eb92883d2704a30b1d8a7bf494ce226b523e5f85a681eb5de8349c9564e62d389876d0e5fe5cc06fb9412d9d1cb61b',
          },
        ],
        '0x19': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Cronos',
            signature:
              '0xa1856ef8c948b0a5204da687d53231848de2a585def9faac05c23c47412615dc476db943010164356b1d2ca8a8a66a8b0ae2d30c11b6b2aaf1cca116f0a333761c',
          },
        ],
        '0x2105': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Base',
            signature:
              '0xbdddd2e925cf2cc7e148d3c11b02c917995fba8f3a3dc0b73c0059d029feca88014e723b8a32b2310a60c5b1cc17dfb3ae180b5a39f1d3264f985314b9168e0a1c',
          },
        ],
        '0x279f': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Monad Testnet',
            signature:
              '0x85ec60e9dbac6404b66803b5abace8517ce1325bb6391b7d1ff8ec4433bbe62f4363031873a11ed79364290e196a47830fc36346a9aaf2e44518c1101496983c1b',
          },
        ],
        '0x27d8': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Chiado',
            signature:
              '0x0ff531d6afcc191c3b3bdffc1596d9ce8d1d52fa500ea2097c0823820a66f97963b88b646d4d4edbc0f781127d7985b87132d89c62c3cb4ad42848ce289645fa1b',
          },
        ],
        '0x38': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'BNB',
            signature:
              '0x28ae371904b3ba71344e426c8de0e2cee0b8529a9510c059b412671655881ad646b8cf544342a5f8e0753eda83221e14e3c9dae5435417401f5fee8ee1d63dce1b',
          },
        ],
        '0x3909': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Sonic Testnet',
            signature:
              '0xc092cc0bcf804f95eb659d281c00586bc72018a242d66fefacdc33a990faf99478c368612277cbbf72aee4a10b7ace6d8666f2c8c4fece9daada40cb360190631b',
          },
        ],
        '0x483': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Intuition Mainnet',
            signature:
              '0x0bb2e5471222492f516a6f1d92fd2b592645bf4124db1b53a6e1b2c505da9c3877fbbdc03642dc8be4ffdfb84a880662dde7b9be394114271b7dd1c217dca9ed1b',
          },
        ],
        '0x515': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Unichain Sepolia',
            signature:
              '0x64487330691a05700a2321ee1db4092adce9590e7aded6e489df024838ecec734c935d182f74883818cb7659d5c784163573afdf8221252fa68d960cbe1c312f1b',
          },
        ],
        '0x530': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Sei Testnet',
            signature:
              '0x91135fcd7bfb9e2456c227ff12905128c3854db36775278d47b96c3c669f730c4063e3a62d94884617769bbad2868f35d725cb3b611d9bd1231bceb5967724711c',
          },
        ],
        '0x531': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Sei Mainnet',
            signature:
              '0xde089fc9af662bc4b0f873e4dc79760f6c3539f6f1cf32d9bc46baccf86ebae070a9062436f29ee86d04cc55699b27579f657922a2292ec2f1c5170d587917401b',
          },
        ],
        '0x61': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'BNB Testnet',
            signature:
              '0x80aaf42c70b0b9efdf26e38ced69fce70f6b4f5496e7e59888819c14fb16290301ad049299d99e3650fa1a616a87bb80eb52ae9f02ddd8b53dd6b983275d0eb61b',
          },
        ],
        '0x64': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Gnosis',
            signature:
              '0xd0cfc2959c866e5218faf675f852e0c7021a454064e509d40256c5bec395e300381c19dcbec2e921b2f6d7d9a925a39dee8ea2e8dd8f595633b8dc333d91f1af1b',
          },
        ],
        '0x66eee': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Arbitrum Sepolia',
            signature:
              '0x6fdb53ecf8f575b85ff9895277b1f8e11349970fbb42225fe41587a072bbcef43e8d54303c4e1aa38d44cae9ba2c8bf825e9e138176d6b09a729cd82a14356cf1b',
          },
        ],
        '0x82': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Unichain Mainnet',
            signature:
              '0x54c423b1af4abbd1fb226e260dddba757acbcd8881e6b55b842c6b839874fa3f0e2f77685389ad5c28e096f12ef22557cebf6a77f6064baa071453a445a4c7d51c',
          },
        ],
        '0x88bb0': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Hoodi Testnet',
            signature:
              '0x23de8eb645a65b08721e5d2194063acead5f5f818474b7884ae767c7aaf9bb9b22233ab92684bc41087f8509e945d96083124ae1919a9357f2ae65267df4f0e21b',
          },
        ],
        '0x89': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Polygon',
            signature:
              '0x302aa2d59940e88f35d2fa140fe6a1e9dc682218a444a7fb2d88f007fbe7792b2b8d615f5ae1e4f184533a02c47d8ac0f6ba3f591679295dff93c65095c0f03d1b',
          },
        ],
        '0x8f': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Monad',
            signature:
              '0x12d31e58c92cdc29dac8af0405883b3b0ee44156d7fdf5c3c2ffa4138f2461cc20e7f8625431dbd24bb784407d1a1d9bdb75b191a6cf127eac68b67d13bd11e41c',
          },
        ],
        '0x92': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Sonic Mainnet',
            signature:
              '0x9f2a94332f2b71bff8a772053f47dbb65e26e5286341be0a3c55270d5549351f1dddb7566be0619b0150d42d540b0847cb0acbd0ab118ff608a40a18400834711b',
          },
        ],
        '0xa': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Optimism',
            signature:
              '0x60e12ffc04e098bd26a897ed2a974e4e255fc6db3b052fe3a2647372bfbac76f096bf5236510ddc217e12b802e08617cc27292d69ca51b0467ba91c6df74cd7b1c',
          },
        ],
        '0xa4b1': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Arbitrum One',
            signature:
              '0xc3be82057efec197d92b0cbb7cef9d50dba0345646524687a3ae7235a8fcb1706ba79f197d45fcf4c6cfb5808ef70258c5f6bb29b7e3553a4b9660692eb5e81d1b',
          },
        ],
        '0xa4ba': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Arbitrum Nova',
            signature:
              '0x818898e7f90f2f1f47dc7bec74dd683dfcc11efc7025d81f57644d366a3d9e442edb789731045ccb5ba89ee0d84bb517194bb9a097b152922bbd39ffd022ff421c',
          },
        ],
        '0xa4ec': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Celo Mainnet',
            signature:
              '0x1421ea4d014170a4fc5d0559f267974f4aa095a6e6047b107eff1807afa425774775f796a52a90b767810eade3b5919087bb361651a7b8f4f9679f1f46adb60e1b',
          },
        ],
        '0xaa044c': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Celo Sepolia',
            signature:
              '0x1590458cdfa10225e4fe734ed44deec95ac1887c877e63deb5ad35b41025c9ef2f33666cdd2c189b1999a78072ab9f8f122d93a52eaf12687fb2ff5b74d8de9f1c',
          },
        ],
        '0xaa36a7': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Sepolia - Official',
            signature:
              '0x1aba1c0dafadab6663efdd6086764a9b9fa5ab5c002e88ebae85edea162fbc425c398b2b93afdc036503f12361c05a7ff0b409ee523d5277e0b4d0a840679e591c',
          },
          {
            address: '0xCd8D6C5554e209Fbb0deC797C6293cf7eAE13454',
            name: 'Sepolia - Testing',
            signature:
              '0x016cf109489c415ba28e695eb3cb06ac46689c5c49e2aba101d7ec2f68c890282563b324f5c8df5e0536994451825aa235438b7346e8c18b4e64161d990781891c',
          },
        ],
        '0xaa37dc': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Optimism Sepolia',
            signature:
              '0xa60cab833af6a8aa2dcc80d5e12d9e1566edb6cdf51c38e7cf43d441dac561007f05643e73e6b00107e18dbf15de98aae14192306276e92d654f62bd7c3023241c',
          },
        ],
        '0xe708': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Linea',
            signature:
              '0x8bad472a54f1be8adbcce8badc512045a467d64aa2affce55eb6ecb9b6eda8a142eee478bc99a81580ff52d5daea857eb9e482e457b1e121c0574191e01ec9f21c',
          },
        ],
      },
      supportedChains: [
        '0x1',
        '0x1012',
        '0x1079',
        '0x13882',
        '0x138c5',
        '0x138de',
        '0x13fb',
        '0x14a34',
        '0x152',
        '0x18c6',
        '0x19',
        '0x2105',
        '0x279f',
        '0x27d8',
        '0x38',
        '0x3909',
        '0x483',
        '0x515',
        '0x530',
        '0x531',
        '0x61',
        '0x64',
        '0x66eee',
        '0x82',
        '0x88bb0',
        '0x89',
        '0x8f',
        '0x92',
        '0xa',
        '0xa4b1',
        '0xa4ba',
        '0xa4ec',
        '0xaa044c',
        '0xaa36a7',
        '0xaa37dc',
        '0xe708',
      ],
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  confirmations_enforced_simulations: {
    inProd: true,
    name: 'confirmations_enforced_simulations',
    productionDefault: {},
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  confirmations_gas_buffer: {
    inProd: true,
    name: 'confirmations_gas_buffer',
    productionDefault: {
      default: 1,
      included: 1.5,
      perChainConfig: {
        '0x18c6': {
          base: 1.3,
          name: 'megaeth',
        },
        '0x18c7': {
          base: 1.3,
          name: 'megaeth',
        },
        '0x2105': {
          eip7702: 1.3,
          name: 'base',
        },
        '0x38': {
          eip7702: 1.3,
          name: 'bnb',
        },
        '0xa': {
          eip7702: 1.3,
          name: 'optimism',
        },
        '0xa4b1': {
          base: 1.2,
          name: 'arbitrum',
        },
      },
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  confirmations_incoming_transactions: {
    inProd: true,
    name: 'confirmations_incoming_transactions',
    productionDefault: {
      pollingIntervalMs: 86400000,
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  confirmations_pay: {
    inProd: true,
    name: 'confirmations_pay',
    productionDefault: {
      allowedPredictWithdrawTokens: {
        '0x1': [
          '0x0000000000000000000000000000000000000000',
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        ],
        '0x38': [
          '0x0000000000000000000000000000000000000000',
          '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        ],
        '0x89': [
          '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
          '0x0000000000000000000000000000000000000000',
          '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        ],
      },
      attemptsMax: 4,
      bufferInitial: 0.015,
      bufferStep: 0.015,
      bufferSubsequent: 0.05,
      payStrategies: {
        relay: {
          enabled: true,
          gaslessEnabled: false,
        },
      },
      perpsWithdrawAnyToken: false,
      predictWithdrawAnyToken: true,
      relayDisabledGasStationChains: [],
      relayExecuteUrl: 'https://intents.api.cx.metamask.io/relay/execute',
      relayFallbackGas: {
        estimate: '900001',
        max: '1500001',
      },
      relayQuoteUrl: 'https://intents.api.cx.metamask.io/relay/quote',
      slippage: 0.02,
      slippageTokens: {
        '0x1': {
          '0x0000000000000000000000000000000000000000': 0.005,
          '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 0.005,
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 0.005,
          '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 0.005,
          '0xacA92E438df0B2401fF60dA7E4337B687a2435DA': 0.005,
          '0xdAC17F958D2ee523a2206206994597C13D831ec7': 0.005,
        },
        '0x2105': {
          '0x0000000000000000000000000000000000000000': 0.005,
          '0x4200000000000000000000000000000000000006': 0.005,
          '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': 0.005,
          '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2': 0.005,
        },
        '0x38': {
          '0x0000000000000000000000000000000000000000': 0.005,
          '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c': 0.005,
          '0x2170Ed0880ac9A755fd29B2688956BD959F933F8': 0.005,
          '0x55d398326f99059fF775485246999027B3197955': 0.005,
          '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d': 0.005,
        },
        '0x89': {
          '0x0000000000000000000000000000000000001010': 0.005,
          '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': 0.005,
          '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359': 0.005,
          '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619': 0.005,
          '0xc2132D05D31c914a87C6611C10748AEb04B58e8F': 0.005,
        },
        '0xa4b1': {
          '0x0000000000000000000000000000000000000000': 0.005,
          '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1': 0.005,
          '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9': 0.005,
          '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': 0.005,
        },
        '0xe708': {
          '0x0000000000000000000000000000000000000000': 0.005,
          '0x176211869cA2b568f2A7D4EE941E073a821EE1ff': 0.005,
          '0xA219439258ca9da29E9Cc4cE5596924745e12B93': 0.005,
          '0xacA92E438df0B2401fF60dA7E4337B687a2435DA': 0.005,
          '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f': 0.005,
        },
      },
      strategyOrder: ['relay'],
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  confirmations_pay_dapps: {
    inProd: true,
    name: 'confirmations_pay_dapps',
    productionDefault: {
      enabled: false,
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  confirmations_pay_extended: {
    inProd: true,
    name: 'confirmations_pay_extended',
    productionDefault: [
      {
        scope: {
          type: 'threshold',
          value: 0.5,
        },
        thresholdName: 'control',
        thresholdVersion: 2,
        value: {
          payStrategies: {
            relay: {
              gaslessEnabled: true,
            },
          },
          depositLimit: {
            moneyAccountDeposit: 500000,
          },
          prefilledAmount: {
            default: {
              enabled: false,
            },
            overrides: {
              musdConversion: {
                enabled: false,
              },
              moneyAccountDeposit: {
                enabled: false,
              },
            },
          },
        },
      },
      {
        scope: {
          type: 'threshold',
          value: 1,
        },
        thresholdName: 'treatment',
        thresholdVersion: 2,
        value: {
          payStrategies: {
            relay: {
              gaslessEnabled: true,
            },
          },
          depositLimit: {
            moneyAccountDeposit: 500000,
          },
          prefilledAmount: {
            default: {
              enabled: false,
            },
            overrides: {
              musdConversion: {
                enabled: false,
              },
              moneyAccountDeposit: {
                enabled: true,
              },
            },
          },
        },
      },
    ],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  confirmations_pay_hardware: {
    inProd: true,
    name: 'confirmations_pay_hardware',
    productionDefault: {
      enabled: true,
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  confirmations_pay_post_quote: {
    inProd: true,
    name: 'confirmations_pay_post_quote',
    productionDefault: {
      versions: {
        '13.43.0': {
          default: {
            enabled: true,
            hyperliquidActivationFee: {
              enabled: true,
            },
            tokens: {},
          },
          overrides: {
            perpsWithdraw: {
              enabled: true,
              hyperliquidActivationFee: {
                enabled: true,
              },
              tokens: {
                '0x1': [
                  '0x0000000000000000000000000000000000000000',
                  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                  '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                  '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
                  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
                ],
                '0x2105': [
                  '0x0000000000000000000000000000000000000000',
                  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                ],
                '0x38': [
                  '0x0000000000000000000000000000000000000000',
                  '0x55d398326f99059fF775485246999027B3197955',
                  '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
                ],
                '0x89': [
                  '0x0000000000000000000000000000000000001010',
                  '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
                  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
                ],
                '0xa4b1': [
                  '0x0000000000000000000000000000000000000000',
                  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
                  '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
                ],
                '0xe708': [
                  '0x0000000000000000000000000000000000000000',
                  '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
                ],
              },
            },
            moneyAccountWithdraw: {
              enabled: true,
              tokens: {
                '0x38': [
                  '0x0000000000000000000000000000000000000000',
                  '0x55d398326f99059fF775485246999027B3197955',
                  '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
                ],
                '0x89': ['0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'],
                '0x8f': ['0xacA92E438df0B2401fF60dA7E4337B687a2435DA'],
                '0xa4b1': ['0xaf88d065e77c8cC2239327C5EDb3A432268e5831'],
                '0xe708': [
                  '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
                  '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
                ],
                '0x1': [
                  '0x0000000000000000000000000000000000000000',
                  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                  '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                  '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
                  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
                  '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                ],
                '0x2105': [
                  '0x0000000000000000000000000000000000000000',
                  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                ],
              },
            },
          },
        },
      },
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  confirmations_pay_tokens: {
    inProd: true,
    name: 'confirmations_pay_tokens',
    productionDefault: {
      enabled: false,
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  confirmations_relay_fixed_spread: {
    inProd: true,
    name: 'confirmations_relay_fixed_spread',
    productionDefault: {
      enabled: false,
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  confirmations_transactions: {
    // Contains acceleratedPolling per-chain configs, batchSizeLimit, etc.
    // Storing simplified version; full value has ~100 chain entries.
    inProd: true,
    name: 'confirmations_transactions',
    productionDefault: {
      acceleratedPolling: {
        defaultCountMax: 10,
        defaultIntervalMs: 3000,
        perChainConfig: {
          '0x1': {
            blockTime: 12000,
            chainId: '1',
            countMax: 10,
            intervalMs: 3000,
            name: 'ETHEREUM',
          },
          '0x1042': {
            blockTime: 250,
            chainId: '4162',
            countMax: 15,
            intervalMs: 500,
            name: 'SX_ROLLUP',
          },
          '0x10e6': {
            blockTime: 1000,
            chainId: '4326',
            countMax: 10,
            intervalMs: 700,
            name: 'MEGAETH_MAINNET',
          },
          '0x1142c': {
            blockTime: 250,
            chainId: '70700',
            countMax: 15,
            intervalMs: 500,
            name: 'PROOF_OF_PLAY_APEX',
          },
          '0x1142d': {
            blockTime: 250,
            chainId: '70701',
            countMax: 15,
            intervalMs: 500,
            name: 'PROOF_OF_PLAY_BOSS',
          },
          '0x11c3': {
            blockTime: 250,
            chainId: '4547',
            countMax: 15,
            intervalMs: 500,
            name: 'TRUMPCHAIN',
          },
          '0x123': {
            blockTime: 2000,
            chainId: '291',
            countMax: 10,
            intervalMs: 1300,
            name: 'ORDERLY',
          },
          '0x128ca': {
            blockTime: 250,
            chainId: '75978',
            countMax: 15,
            intervalMs: 500,
            name: 'FUSION',
          },
          '0x1331': {
            blockTime: 250,
            chainId: '4913',
            countMax: 15,
            intervalMs: 500,
            name: 'API3',
          },
          '0x134b3cf': {
            blockTime: 250,
            chainId: '20231119',
            countMax: 15,
            intervalMs: 500,
            name: 'DERI',
          },
          '0x1388': {
            blockTime: 2000,
            chainId: '5000',
            countMax: 10,
            intervalMs: 1300,
            name: 'MANTLE',
          },
          '0x13881': {
            blockTime: 2000,
            chainId: '80001',
            countMax: 10,
            intervalMs: 1300,
            name: 'POLYGON_MUMBAI',
          },
          '0x13882': {
            blockTime: 1667,
            chainId: '80002',
            countMax: 10,
            intervalMs: 1100,
            name: 'POLYGON_AMOY',
          },
          '0x138de': {
            blockTime: 2000,
            chainId: '80094',
            countMax: 10,
            intervalMs: 1300,
            name: 'BERACHAIN',
          },
          '0x13a': {
            blockTime: 12000,
            chainId: '314',
            countMax: 10,
            intervalMs: 3000,
            name: 'FILECOIN',
          },
          '0x13a43': {
            blockTime: 250,
            chainId: '80451',
            countMax: 15,
            intervalMs: 500,
            name: 'GEO_GENESIS',
          },
          '0x13bf8': {
            blockTime: 250,
            chainId: '80888',
            countMax: 15,
            intervalMs: 500,
            name: 'ONYX',
          },
          '0x13c23': {
            blockTime: 250,
            chainId: '80931',
            countMax: 15,
            intervalMs: 500,
            name: 'FORTA',
          },
          '0x13e31': {
            blockTime: 2000,
            chainId: '81457',
            countMax: 10,
            intervalMs: 1300,
            name: 'BLAST',
          },
          '0x13f8': {
            blockTime: 2000,
            chainId: '5112',
            countMax: 10,
            intervalMs: 1300,
            name: 'HAM',
          },
          '0x1406f40': {
            blockTime: 250,
            chainId: '21000000',
            countMax: 15,
            intervalMs: 500,
            name: 'CORN',
          },
          '0x142b6': {
            blockTime: 250,
            chainId: '82614',
            countMax: 15,
            intervalMs: 500,
            name: 'VEMP',
          },
          '0x144': {
            blockTime: 1000,
            chainId: '324',
            countMax: 10,
            intervalMs: 700,
            name: 'ZKSYNC',
          },
          '0x14a34': {
            blockTime: 250,
            chainId: '84532',
            countMax: 15,
            intervalMs: 500,
            name: 'BASE_SEPOLIA_TESTNET',
          },
          '0x15a9': {
            blockTime: 250,
            chainId: '5545',
            countMax: 15,
            intervalMs: 500,
            name: 'DUCK',
          },
          '0x15b43': {
            blockTime: 250,
            chainId: '88899',
            countMax: 15,
            intervalMs: 500,
            name: 'UNITE',
          },
          '0x15eb': {
            blockTime: 1000,
            chainId: '5611',
            countMax: 10,
            intervalMs: 700,
            name: 'OPBNB_TESTNET',
          },
          '0x163e7': {
            blockTime: 250,
            chainId: '91111',
            countMax: 15,
            intervalMs: 500,
            name: 'HENEZ',
          },
          '0x16876': {
            blockTime: 250,
            chainId: '92278',
            countMax: 15,
            intervalMs: 500,
            name: 'MIRACLE',
          },
          '0x16fd8': {
            blockTime: 250,
            chainId: '94168',
            countMax: 15,
            intervalMs: 500,
            name: 'LUMITERRA',
          },
          '0x171': {
            blockTime: 10000,
            chainId: '369',
            countMax: 10,
            intervalMs: 3000,
            name: 'PULSECHAIN',
          },
          '0x1713c': {
            blockTime: 250,
            chainId: '94524',
            countMax: 15,
            intervalMs: 500,
            name: 'IDEX',
          },
          '0x18232': {
            blockTime: 667,
            chainId: '98866',
            countMax: 15,
            intervalMs: 500,
            name: 'PLUME',
          },
          '0x18c6': {
            blockTime: 1000,
            chainId: '6342',
            countMax: 10,
            intervalMs: 700,
            name: 'MEGAETH_TESTNET',
          },
          '0x18c7': {
            blockTime: 1000,
            chainId: '6343',
            countMax: 10,
            intervalMs: 700,
            name: 'MEGAETH_TESTNET_V2',
          },
          '0x19': {
            blockTime: 667,
            chainId: '25',
            countMax: 15,
            intervalMs: 500,
            name: 'CRONOS',
          },
          '0x1b254': {
            blockTime: 250,
            chainId: '111188',
            countMax: 15,
            intervalMs: 500,
            name: 'REAL',
          },
          '0x1b58': {
            blockTime: 3667,
            chainId: '7000',
            countMax: 10,
            intervalMs: 2400,
            name: 'ZETACHAIN',
          },
          '0x1b59': {
            blockTime: 3000,
            chainId: '7001',
            countMax: 10,
            intervalMs: 2000,
            name: 'ZETACHAIN_TESTNET',
          },
          '0x1ecf': {
            blockTime: 250,
            chainId: '7887',
            countMax: 15,
            intervalMs: 500,
            name: 'KINTO',
          },
          '0x2105': {
            blockTime: 2000,
            chainId: '8453',
            countMax: 10,
            intervalMs: 1300,
            name: 'BASE',
          },
          '0x2272': {
            blockTime: 250,
            chainId: '8818',
            countMax: 15,
            intervalMs: 500,
            name: 'CLINK',
          },
          '0x2611': {
            blockTime: 1000,
            chainId: '9745',
            countMax: 10,
            intervalMs: 700,
            name: 'PLASMA',
          },
          '0x2780b': {
            blockTime: 250,
            chainId: '161803',
            countMax: 15,
            intervalMs: 500,
            name: 'EVENTUM',
          },
          '0x279f': {
            blockTime: 500,
            chainId: '10143',
            countMax: 15,
            intervalMs: 500,
            name: 'MONAD_TESTNET',
          },
          '0x27bc86aa': {
            blockTime: 250,
            chainId: '666666666',
            countMax: 15,
            intervalMs: 500,
            name: 'DEGEN_CHAIN',
          },
          '0x28c58': {
            blockTime: 6000,
            chainId: '167000',
            countMax: 10,
            intervalMs: 3000,
            name: 'TAIKO',
          },
          '0x28c61': {
            blockTime: 1000,
            chainId: '167009',
            countMax: 10,
            intervalMs: 700,
            name: 'TAIKO_HEKLA',
          },
          '0x2a': {
            blockTime: 4000,
            chainId: '42',
            countMax: 10,
            intervalMs: 2700,
            name: 'LUKSO',
          },
          '0x2b2': {
            blockTime: 2000,
            chainId: '690',
            countMax: 10,
            intervalMs: 1300,
            name: 'REDSTONE',
          },
          '0x2ba': {
            blockTime: 2000,
            chainId: '698',
            countMax: 10,
            intervalMs: 1300,
            name: 'MATCHAIN',
          },
          '0x2eb': {
            blockTime: 1000,
            chainId: '747',
            countMax: 10,
            intervalMs: 700,
            name: 'FLOW',
          },
          '0x2f0': {
            blockTime: 250,
            chainId: '752',
            countMax: 15,
            intervalMs: 500,
            name: 'RIVALZ',
          },
          '0x3023': {
            blockTime: 250,
            chainId: '12323',
            countMax: 15,
            intervalMs: 500,
            name: 'HUDDLE01',
          },
          '0x316b8': {
            blockTime: 250,
            chainId: '202424',
            countMax: 15,
            intervalMs: 500,
            name: 'BLOCKFIT',
          },
          '0x32': {
            blockTime: 2000,
            chainId: '50',
            countMax: 10,
            intervalMs: 1300,
            name: 'XDC',
          },
          '0x343b': {
            blockTime: 2000,
            chainId: '13371',
            countMax: 10,
            intervalMs: 1300,
            name: 'IMMUTABLE',
          },
          '0x34a1': {
            blockTime: 2000,
            chainId: '13473',
            countMax: 10,
            intervalMs: 1300,
            name: 'IMMUTABLE_TESTNET',
          },
          '0x34fb5e38': {
            blockTime: 2000,
            chainId: '888888888',
            countMax: 10,
            intervalMs: 1300,
            name: 'ANXIENT8',
          },
          '0x38': {
            blockTime: 667,
            chainId: '56',
            countMax: 15,
            intervalMs: 500,
            name: 'BNB',
          },
          '0x3bd': {
            blockTime: 2000,
            chainId: '957',
            countMax: 10,
            intervalMs: 1300,
            name: 'LYRA',
          },
          '0x3e7': {
            blockTime: 1000,
            chainId: '999',
            countMax: 10,
            intervalMs: 700,
            name: 'HYPEREVM',
          },
          '0x4268': {
            blockTime: 12000,
            chainId: '17000',
            countMax: 10,
            intervalMs: 3000,
            name: 'ETHEREUM_HOLESKY',
          },
          '0x42af': {
            blockTime: 250,
            chainId: '17071',
            countMax: 15,
            intervalMs: 500,
            name: 'ONCHAIN_POINTS',
          },
          '0x46f': {
            blockTime: 2000,
            chainId: '1135',
            countMax: 10,
            intervalMs: 1300,
            name: 'LISK',
          },
          '0x515': {
            blockTime: 2000,
            chainId: '1301',
            countMax: 10,
            intervalMs: 1300,
            name: 'UNICHAIN_SEPOLIA',
          },
          '0x52415249': {
            blockTime: 250,
            chainId: '1380012617',
            countMax: 15,
            intervalMs: 500,
            name: 'RARIBLE',
          },
          '0x531': {
            blockTime: 667,
            chainId: '1329',
            countMax: 15,
            intervalMs: 500,
            name: 'SEI',
          },
          '0x5d979': {
            blockTime: 250,
            chainId: '383353',
            countMax: 15,
            intervalMs: 500,
            name: 'CHEESE',
          },
          '0x61': {
            blockTime: 1000,
            chainId: '97',
            countMax: 10,
            intervalMs: 700,
            name: 'BNB_TESTNET',
          },
          '0x62ef': {
            blockTime: 250,
            chainId: '25327',
            countMax: 15,
            intervalMs: 500,
            name: 'EVERCLEAR',
          },
          '0x64': {
            blockTime: 5000,
            chainId: '100',
            countMax: 10,
            intervalMs: 3000,
            name: 'GNOSIS',
          },
          '0x659': {
            blockTime: 250,
            chainId: '1625',
            countMax: 15,
            intervalMs: 500,
            name: 'GRAVITY',
          },
          '0x6c1': {
            blockTime: 250,
            chainId: '1729',
            countMax: 15,
            intervalMs: 500,
            name: 'REYA',
          },
          '0x6f0': {
            blockTime: 667,
            chainId: '1776',
            countMax: 15,
            intervalMs: 500,
            name: 'INJECTIVE',
          },
          '0x725': {
            blockTime: 250,
            chainId: '1829',
            countMax: 15,
            intervalMs: 500,
            name: 'PLAYBLOCK',
          },
          '0x74c': {
            blockTime: 2000,
            chainId: '1868',
            countMax: 10,
            intervalMs: 1300,
            name: 'SONEIUM',
          },
          '0x76adf1': {
            blockTime: 2000,
            chainId: '7777777',
            countMax: 10,
            intervalMs: 1300,
            name: 'ZORA',
          },
          '0x7c5': {
            blockTime: 250,
            chainId: '1989',
            countMax: 15,
            intervalMs: 500,
            name: 'LYDIA',
          },
          '0x7cc': {
            blockTime: 250,
            chainId: '1996',
            countMax: 15,
            intervalMs: 500,
            name: 'SANKO',
          },
          '0x7ea': {
            blockTime: 2000,
            chainId: '2026',
            countMax: 10,
            intervalMs: 1300,
            name: 'EDGELESS',
          },
          '0x813df': {
            blockTime: 250,
            chainId: '529375',
            countMax: 15,
            intervalMs: 500,
            name: 'LAYER_K',
          },
          '0x8173': {
            blockTime: 250,
            chainId: '33139',
            countMax: 15,
            intervalMs: 500,
            name: 'APECHAIN',
          },
          '0x82': {
            blockTime: 2000,
            chainId: '130',
            countMax: 10,
            intervalMs: 1300,
            name: 'UNICHAIN',
          },
          '0x8274f': {
            blockTime: 3667,
            chainId: '534351',
            countMax: 10,
            intervalMs: 2400,
            name: 'SCROLL_SEPOLIA',
          },
          '0x82750': {
            blockTime: 1000,
            chainId: '534352',
            countMax: 10,
            intervalMs: 700,
            name: 'SCROLL',
          },
          '0x8279': {
            blockTime: 250,
            chainId: '33401',
            countMax: 15,
            intervalMs: 500,
            name: 'SLINGSHOTDAO',
          },
          '0x868b': {
            blockTime: 2000,
            chainId: '34443',
            countMax: 10,
            intervalMs: 1300,
            name: 'MODE',
          },
          '0x88b': {
            blockTime: 250,
            chainId: '2187',
            countMax: 15,
            intervalMs: 500,
            name: 'GAME7',
          },
          '0x88bb0': {
            blockTime: 12000,
            chainId: '560048',
            countMax: 10,
            intervalMs: 3000,
            name: 'HOODI',
          },
          '0x89': {
            blockTime: 2000,
            chainId: '137',
            countMax: 10,
            intervalMs: 1300,
            name: 'POLYGON',
          },
          '0x8f': {
            blockTime: 500,
            chainId: '143',
            countMax: 15,
            intervalMs: 500,
            name: 'MONAD',
          },
          '0x974': {
            blockTime: 250,
            chainId: '2420',
            countMax: 15,
            intervalMs: 500,
            name: 'DOGELON',
          },
          '0x98967f': {
            blockTime: 250,
            chainId: '9999999',
            countMax: 15,
            intervalMs: 500,
            name: 'FLUENCE',
          },
          '0x99797f': {
            blockTime: 250,
            chainId: '10058111',
            countMax: 15,
            intervalMs: 500,
            name: 'SPOTLIGHT',
          },
          '0x9c4400': {
            blockTime: 250,
            chainId: '10241024',
            countMax: 15,
            intervalMs: 500,
            name: 'ALIENX',
          },
          '0x9c4401': {
            blockTime: 250,
            chainId: '10241025',
            countMax: 15,
            intervalMs: 500,
            name: 'ALIENX_TESTNET',
          },
          '0x9dd': {
            blockTime: 250,
            chainId: '2525',
            countMax: 15,
            intervalMs: 500,
            name: 'INEVM',
          },
          '0xa': {
            blockTime: 2000,
            chainId: '10',
            countMax: 10,
            intervalMs: 1300,
            name: 'OPTIMISM',
          },
          '0xa0c71fd': {
            blockTime: 2000,
            chainId: '168587773',
            countMax: 10,
            intervalMs: 1300,
            name: 'BLAST_SEPOLIA',
          },
          '0xa1337': {
            blockTime: 250,
            chainId: '660279',
            countMax: 15,
            intervalMs: 500,
            name: 'XAI',
          },
          '0xa1ef': {
            blockTime: 250,
            chainId: '41455',
            countMax: 15,
            intervalMs: 500,
            name: 'ALEPH_ZERO',
          },
          '0xa33fc': {
            blockTime: 250,
            chainId: '668668',
            countMax: 15,
            intervalMs: 500,
            name: 'CONWAI',
          },
          '0xa3c3': {
            blockTime: 250,
            chainId: '41923',
            countMax: 15,
            intervalMs: 500,
            name: 'EDUCHAIN',
          },
          '0xa4b1': {
            blockTime: 250,
            chainId: '42161',
            countMax: 15,
            intervalMs: 500,
            name: 'ARBITRUM_ONE',
          },
          '0xa4ba': {
            blockTime: 250,
            chainId: '42170',
            countMax: 15,
            intervalMs: 500,
            name: 'ARBITRUM_NOVA',
          },
          '0xa6': {
            blockTime: 1333,
            chainId: '166',
            countMax: 10,
            intervalMs: 900,
            name: 'OMNI',
          },
          '0xa867': {
            blockTime: 1200,
            chainId: '43111',
            countMax: 10,
            intervalMs: 800,
            name: 'HEMI',
          },
          '0xa86a': {
            blockTime: 1000,
            chainId: '43114',
            countMax: 10,
            intervalMs: 700,
            name: 'AVALANCHE',
          },
          '0xa9': {
            blockTime: 2000,
            chainId: '169',
            countMax: 10,
            intervalMs: 1300,
            name: 'MANTA',
          },
          '0xaa36a7': {
            blockTime: 12000,
            chainId: '11155111',
            countMax: 10,
            intervalMs: 3000,
            name: 'ETHEREUM_SEPOLIA',
          },
          '0xaa37dc': {
            blockTime: 2000,
            chainId: '11155420',
            countMax: 10,
            intervalMs: 1300,
            name: 'OPTIMISM_SEPOLIA',
          },
          '0xab5': {
            blockTime: 4000,
            chainId: '2741',
            countMax: 10,
            intervalMs: 2700,
            name: 'ABSTRACT',
          },
          '0xb1c9': {
            blockTime: 250,
            chainId: '45513',
            countMax: 15,
            intervalMs: 500,
            name: 'BLESSNET',
          },
          '0xb5f': {
            blockTime: 250,
            chainId: '2911',
            countMax: 15,
            intervalMs: 500,
            name: 'HYTOPIA',
          },
          '0xb67d2': {
            blockTime: 1000,
            chainId: '747474',
            countMax: 10,
            intervalMs: 700,
            name: 'KATANA',
          },
          '0xb9': {
            blockTime: 2000,
            chainId: '185',
            countMax: 10,
            intervalMs: 1300,
            name: 'MINT',
          },
          '0xbde31': {
            blockTime: 250,
            chainId: '777777',
            countMax: 15,
            intervalMs: 500,
            name: 'WINR',
          },
          '0xc350': {
            blockTime: 250,
            chainId: '50000',
            countMax: 15,
            intervalMs: 500,
            name: 'CITRONUS',
          },
          '0xca74': {
            blockTime: 250,
            chainId: '51828',
            countMax: 15,
            intervalMs: 500,
            name: 'CHAINBOUNTY',
          },
          '0xcc': {
            blockTime: 1000,
            chainId: '204',
            countMax: 10,
            intervalMs: 700,
            name: 'OPBNB',
          },
          '0xd0d0': {
            blockTime: 250,
            chainId: '53456',
            countMax: 15,
            intervalMs: 500,
            name: 'DODO',
          },
          '0xd7cc': {
            blockTime: 250,
            chainId: '55244',
            countMax: 15,
            intervalMs: 500,
            name: 'SUPERPOSITION',
          },
          '0xe34': {
            blockTime: 6000,
            chainId: '3636',
            countMax: 10,
            intervalMs: 3000,
            name: 'BOTANIX_TESTNET',
          },
          '0xe35': {
            blockTime: 5667,
            chainId: '3637',
            countMax: 10,
            intervalMs: 3000,
            name: 'BOTANIX',
          },
          '0xe4': {
            blockTime: 250,
            chainId: '228',
            countMax: 15,
            intervalMs: 500,
            name: 'MIND',
          },
          '0xe49b1': {
            blockTime: 250,
            chainId: '936369',
            countMax: 15,
            intervalMs: 500,
            name: 'LOGX',
          },
          '0xe705': {
            blockTime: 2000,
            chainId: '59141',
            countMax: 10,
            intervalMs: 1300,
            name: 'LINEA_SEPOLIA',
          },
          '0xe708': {
            blockTime: 2000,
            chainId: '59144',
            countMax: 10,
            intervalMs: 1300,
            name: 'LINEA',
          },
          '0xe8': {
            blockTime: 25333,
            chainId: '232',
            countMax: 10,
            intervalMs: 3000,
            name: 'LENS',
          },
          '0xf4290': {
            blockTime: 250,
            chainId: '1000080',
            countMax: 15,
            intervalMs: 500,
            name: 'SCOREKOUNT',
          },
          '0xfa': {
            blockTime: 4000,
            chainId: '250',
            countMax: 10,
            intervalMs: 2700,
            name: 'FANTOM',
          },
          '0xfc': {
            blockTime: 2000,
            chainId: '252',
            countMax: 10,
            intervalMs: 1300,
            name: 'FRAXTAL',
          },
          '0xfee': {
            blockTime: 250,
            chainId: '4078',
            countMax: 15,
            intervalMs: 500,
            name: 'COMETH',
          },
        },
      },
      batchSizeLimit: 10,
      gasEstimateFallback: {
        perChainConfig: {
          '0x1237': {
            fixed: 25000000,
          },
          '0x279f': {
            fixed: 1000000,
          },
        },
      },
      gasFeeRandomisation: {
        randomisedGasFeeDigits: {
          '0x2105': 5,
        },
      },
      timeoutAttempts: {
        default: 30,
        perChainConfig: {
          '0x2105': 100,
          '0x38': 300,
          '0x3e7': 240,
          '0xa4b1': 800,
        },
      },
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  contentfulCarouselEnabled: {
    inProd: true,
    name: 'contentfulCarouselEnabled',
    productionDefault: true,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  coreExtensionUxCeux1024AbtestReferralUi: {
    inProd: true,
    name: 'coreExtensionUxCeux1024AbtestReferralUi',
    productionDefault: [],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  coreExtensionUxCeux1096AbtestReferralUi: {
    inProd: true,
    name: 'coreExtensionUxCeux1096AbtestReferralUi',
    productionDefault: [
      {
        name: 'control',
        scope: {
          type: 'threshold',
          value: 0.5,
        },
      },
      {
        name: 'treatment',
        scope: {
          type: 'threshold',
          value: 1,
        },
      },
    ],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  coreExtensionUxCeux1141AbtestBottomNav: {
    inProd: true,
    name: 'coreExtensionUxCeux1141AbtestBottomNav',
    productionDefault: [
      {
        name: 'control',
        scope: {
          type: 'threshold',
          value: 0.95,
        },
      },
      {
        name: 'treatment',
        scope: {
          type: 'threshold',
          value: 1,
        },
      },
    ],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  corePlatformRpcFailoverForceEnabled: {
    inProd: true,
    name: 'corePlatformRpcFailoverForceEnabled',
    productionDefault: false,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  corePlatformRpcFailoverMode: {
    inProd: true,
    name: 'corePlatformRpcFailoverMode',
    productionDefault: 'enabled',
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  dappOpenSidepanelEnabled: {
    inProd: true,
    name: 'dappOpenSidepanelEnabled',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.44.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  dappSwapMetrics: {
    inProd: true,
    name: 'dappSwapMetrics',
    productionDefault: {
      bridge_quote_fees: 250,
      enabled: true,
      origins: ['https://app.uniswap.org', 'https://metamask.github.io'],
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  dappSwapQa: {
    inProd: true,
    name: 'dappSwapQa',
    productionDefault: {
      enabled: false,
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  dappSwapUi: {
    inProd: true,
    name: 'dappSwapUi',
    productionDefault: {
      enabled: false,
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  defiControllerV2: {
    inProd: true,
    name: 'defiControllerV2',
    productionDefault: {
      versions: {
        '13.41.0': {
          enabled: false,
        },
      },
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  earnCONF1385AbtestPrefilledMaxAmount: {
    inProd: true,
    name: 'earnCONF1385AbtestPrefilledMaxAmount',
    productionDefault: {
      enabled: false,
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  earnMerklCampaignClaiming: {
    inProd: true,
    name: 'earnMerklCampaignClaiming',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.24.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  earnMusdConversionAssetOverviewCtaEnabled: {
    inProd: true,
    name: 'earnMusdConversionAssetOverviewCtaEnabled',
    productionDefault: {
      enabled: false,
      minimumVersion: '0.0.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  earnMusdConversionCtaTokens: {
    inProd: true,
    name: 'earnMusdConversionCtaTokens',
    productionDefault: {
      '0x1': ['USDC', 'USDT', 'DAI'],
      '0xe708': ['USDC', 'USDT', 'DAI'],
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  earnMusdConversionFlowEnabled: {
    inProd: true,
    name: 'earnMusdConversionFlowEnabled',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.44.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  earnMusdConversionGeoBlockedCountries: {
    inProd: true,
    name: 'earnMusdConversionGeoBlockedCountries',
    productionDefault: {
      blockedRegions: ['GB'],
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  earnMusdConversionMinAssetBalanceRequired: {
    inProd: true,
    name: 'earnMusdConversionMinAssetBalanceRequired',
    productionDefault: 0.01,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  earnMusdConversionTokenListItemCtaEnabled: {
    inProd: true,
    name: 'earnMusdConversionTokenListItemCtaEnabled',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.44.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  earnMusdConvertibleTokensAllowlist: {
    inProd: true,
    name: 'earnMusdConvertibleTokensAllowlist',
    productionDefault: {
      '0x1': ['USDC', 'USDT', 'DAI'],
      '0xe708': ['USDC', 'USDT', 'DAI'],
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  earnMusdConvertibleTokensBlocklist: {
    inProd: true,
    name: 'earnMusdConvertibleTokensBlocklist',
    productionDefault: {},
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  earnMusdCtaEnabled: {
    inProd: true,
    name: 'earnMusdCtaEnabled',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.24.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  [ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]: {
    inProd: true,
    name: ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG,
    productionDefault: {
      permissions: [
        'native-token-stream',
        'native-token-periodic',
        'native-token-allowance',
        'erc20-token-stream',
        'erc20-token-periodic',
        'erc20-token-allowance',
        'token-approval-revocation',
      ],
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  enableFiatToggle: {
    inProd: true,
    name: 'enableFiatToggle',
    productionDefault: false,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  enableMultichainAccounts: {
    inProd: true,
    name: 'enableMultichainAccounts',
    productionDefault: {
      enabled: true,
      featureVersion: '1',
      minimumVersion: '13.0.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  enableMultichainAccountsState2: {
    inProd: true,
    name: 'enableMultichainAccountsState2',
    productionDefault: {
      enabled: true,
      featureVersion: '2',
      minimumVersion: '13.5.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  extensionBasicFunctionalityToggle: {
    inProd: true,
    name: 'extensionBasicFunctionalityToggle',
    productionDefault: {
      enabled: false,
      minimumVersion: '13.38.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  extensionPlatformAutoReloadAfterUpdate: {
    inProd: true,
    name: 'extensionPlatformAutoReloadAfterUpdate',
    productionDefault: true,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  extensionSignedDeepLinkWarningEnabled: {
    inProd: true,
    name: 'extensionSignedDeepLinkWarningEnabled',
    productionDefault: [
      {
        name: 'Warning enabled',
        scope: {
          type: 'threshold',
          value: 1,
        },
        value: true,
      },
    ],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  extensionSkipTransactionStatusPage: {
    inProd: true,
    name: 'extensionSkipTransactionStatusPage',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.32.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  extensionTransactionLabels: {
    inProd: true,
    name: 'extensionTransactionLabels',
    productionDefault: false,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  extensionTrustAndSecurityTdp: {
    inProd: true,
    name: 'extensionTrustAndSecurityTdp',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.44.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  extensionUpdatePromptMinimumVersion: {
    inProd: true,
    name: 'extensionUpdatePromptMinimumVersion',
    productionDefault: '0.0.0',
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  [ACTIVE_TAB_DOMAIN_METRICS_FLAG]: {
    inProd: true,
    name: ACTIVE_TAB_DOMAIN_METRICS_FLAG,
    productionDefault: {
      minimumVersion: '13.36.0',
      value: ['x.com', 'twitter.com'],
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  extensionUxActivityListRedesign: {
    inProd: true,
    name: 'extensionUxActivityListRedesign',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.36.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  extensionUxChainlist: {
    inProd: true,
    name: 'extensionUxChainlist',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.41.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  extensionUxDefaultAddressVersioned: {
    inProd: true,
    name: 'extensionUxDefaultAddressVersioned',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.28.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  extensionUxDefiReferralPartners: {
    inProd: true,
    name: 'extensionUxDefiReferralPartners',
    productionDefault: {
      asterdex: true,
      gmx: true,
      hyperliquid: true,
      variational: true,
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  extensionUxNetworkManagement: {
    inProd: true,
    name: 'extensionUxNetworkManagement',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.38.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  extensionUxPna25: {
    inProd: true,
    name: 'extensionUxPna25',
    productionDefault: true,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  extensionUXSearch: {
    inProd: true,
    name: 'extensionUXSearch',
    productionDefault: {
      enabled: false,
      minimumVersion: '13.41.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  extensionUxSidepanel: {
    inProd: true,
    name: 'extensionUxSidepanel',
    productionDefault: false,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  extensionUxTokenManagementFilter: {
    inProd: true,
    name: 'extensionUxTokenManagementFilter',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.33.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  extensionUxTransactionEventToast: {
    inProd: true,
    name: 'extensionUxTransactionEventToast',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.36.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  gasFeesSponsoredNetwork: {
    inProd: true,
    name: 'gasFeesSponsoredNetwork',
    productionDefault: {
      '0x38': false,
      '0x531': true,
      '0x8f': true,
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  isSolanaBuyable: {
    inProd: true,
    name: 'isSolanaBuyable',
    productionDefault: false,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  ledgerDmk: {
    inProd: true,
    name: 'ledgerDmk',
    productionDefault: {
      enabled: false,
      featureVersion: null,
      minimumVersion: null,
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  moneyAccountGeoBlockedCountries: {
    inProd: true,
    name: 'moneyAccountGeoBlockedCountries',
    productionDefault: {
      blockedRegions: ['GB'],
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  moneyAccountVaultConfig: {
    inProd: true,
    name: 'moneyAccountVaultConfig',
    productionDefault: {
      accountantAddress: '0x98A45D90E81849a5743241d3ff765F9Fd788206a',
      boringVault: '0x1C8a336051D2024E318A229d01F9F6CF96efD316',
      chainId: '0x8f',
      lensAddress: '0xa3b5f71AB29BA99B9750327575Dcc456CadC550b',
      tellerAddress: '0xB30755C750E0A7E5BeD3dDAf0D9948Cf2b1CDc87',
      underlyingToken: '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: {
    inProd: false,
    name: MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME,
    productionDefault: {
      enabled: false,
      minimumVersion: '0.0.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  [MONEY_EARNING_SECTION_ENABLED_FLAG_NAME]: {
    inProd: false,
    name: MONEY_EARNING_SECTION_ENABLED_FLAG_NAME,
    productionDefault: {
      enabled: false,
      minimumVersion: '0.0.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  neNetworkDiscoverButton: {
    inProd: true,
    name: 'neNetworkDiscoverButton',
    productionDefault: {
      '0x531': true,
      '0x8f': true,
      '0xe708': true,
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
      'tron:728126428': true,
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  networkAssetsSnapsMigrationSolana: {
    inProd: true,
    name: 'networkAssetsSnapsMigrationSolana',
    productionDefault: {
      versions: {
        '13.41.0': {
          featureVersion: '1',
          minimumSnapVersion: '2.9.0',
          stage: 0,
        },
      },
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  networkAssetsSnapsMigrationStellar: {
    inProd: true,
    name: 'networkAssetsSnapsMigrationStellar',
    productionDefault: {
      versions: {
        '13.41.0': {
          featureVersion: '1',
          minimumSnapVersion: '1.20.0',
          stage: 0,
        },
      },
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  networkAssetsSnapsMigrationTron: {
    inProd: true,
    name: 'networkAssetsSnapsMigrationTron',
    productionDefault: {
      versions: {
        '13.41.0': {
          featureVersion: '1',
          minimumSnapVersion: '1.20.0',
          stage: 0,
        },
      },
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  nonZeroUnusedApprovals: {
    inProd: true,
    name: 'nonZeroUnusedApprovals',
    productionDefault: [
      'https://aerodrome.finance',
      'https://www.aerodrome.finance',
      'https://app.bio.xyz',
      'https://app.ethena.fi',
      'https://app.euler.finance',
      'https://app.rocketx.exchange',
      'https://app.seer.pm',
      'https://app.sky.money',
      'https://app.spark.fi',
      'https://app.tea-fi.com',
      'https://app.uniswap.org',
      'https://bridge.gravity.xyz',
      'https://dev-relay-sdk.vercel.app',
      'https://evm.ekubo.org',
      'https://flaunch.gg',
      'https://fluid.io',
      'https://flyingtulip.com',
      'https://jumper.exchange',
      'https://jumper.xyz',
      'https://linea.build',
      'https://pancakeswap.finance',
      'https://privacypools.com',
      'https://relay.link',
      'https://revoke.cash',
      'https://staging.relay.link',
      'https://superbridge.app',
      'https://swap.defillama.com',
      'https://toros.finance',
      'https://velodrome.finance',
      'https://walletstats.io',
      'https://www.bungee.exchange',
      'https://www.dev.relay.link',
      'https://www.fxhash.xyz',
      'https://www.hydrex.fi',
      'https://www.relay.link',
      'https://yearn.fi',
      'https://app.teller.org',
      'https://kalshi.com',
      'https://app.carbondefi.xyz',
      'https://celo.carbondefi.xyz',
      'https://sei.carbondefi.xyz',
      'https://matcha.xyz',
      'https://app.trysweep.finance',
    ],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  perpsClosePositionLimitOrderEnabled: {
    inProd: true,
    name: 'perpsClosePositionLimitOrderEnabled',
    productionDefault: {
      enabled: false,
      minimumVersion: '13.42.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  perpsEnabled: {
    inProd: true,
    name: 'perpsEnabled',
    productionDefault: false,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  perpsEnabledVersion: {
    inProd: true,
    name: 'perpsEnabledVersion',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.30.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  perpsHip3AllowlistMarkets: {
    inProd: true,
    name: 'perpsHip3AllowlistMarkets',
    productionDefault: '',
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  perpsHip3BlocklistMarkets: {
    inProd: true,
    name: 'perpsHip3BlocklistMarkets',
    productionDefault: '',
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  perpsOrderBookEnabled: {
    // Dark-launched: default OFF in production until rollout.
    inProd: true,
    name: 'perpsOrderBookEnabled',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.43.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  perpsPerpTradingGeoBlockedCountriesV2: {
    inProd: true,
    name: 'perpsPerpTradingGeoBlockedCountriesV2',
    productionDefault: {
      blockedRegions: ['BE', 'US', 'CA-ON', 'GB', 'CU', 'IR', 'KP', 'SY'],
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  perpsShowFullAssetNames: {
    // Dark-launched: default OFF in production until rollout.
    inProd: true,
    name: 'perpsShowFullAssetNames',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.40.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  perpsSlippageConfig2: {
    inProd: true,
    name: 'perpsSlippageConfig2',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.30.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  perpsTAT3382AbtestTabBadge: {
    inProd: true,
    name: 'perpsTAT3382AbtestTabBadge',
    productionDefault: {
      versions: {
        '13.39.0': [
          {
            name: 'control',
            scope: {
              type: 'threshold',
              value: 1,
            },
          },
          {
            name: 'treatment',
            scope: {
              type: 'threshold',
              value: 1,
            },
          },
        ],
      },
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  perpsTerminalBackendEnabled: {
    inProd: true,
    name: 'perpsTerminalBackendEnabled',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.40.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  platformPersistenceSuspendWritesOnShutdown: {
    inProd: true,
    name: 'platformPersistenceSuspendWritesOnShutdown',
    productionDefault: [
      {
        scope: {
          type: 'threshold',
          value: 0,
        },
        thresholdName: 'enabled — 0% rollout',
        thresholdVersion: 2,
        value: {
          enabled: true,
          minimumVersion: '13.41.0',
        },
      },
      {
        scope: {
          type: 'threshold',
          value: 1,
        },
        thresholdName: 'disabled — remaining 100%',
        thresholdVersion: 2,
        value: {
          enabled: false,
          minimumVersion: '0.0.0',
        },
      },
    ],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  platformSplitStateGradualRollout: {
    inProd: true,
    name: 'platformSplitStateGradualRollout',
    productionDefault: [
      {
        name: 'feature is ON',
        scope: {
          type: 'threshold',
          value: 1,
        },
        value: {
          enabled: 1,
          maxAccounts: 99999,
          maxNetworks: 99999,
        },
      },
    ],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  productSafetyScamQuestionnaireEnabled: {
    inProd: true,
    name: 'productSafetyScamQuestionnaireEnabled',
    productionDefault: [],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  productSafetyScamQuestionnaireURLList: {
    inProd: true,
    name: 'productSafetyScamQuestionnaireURLList',
    productionDefault: {
      enabled: false,
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  rampsEnabled: {
    inProd: true,
    name: 'rampsEnabled',
    productionDefault: {
      enabled: false,
      minimumVersion: '13.44.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  rampsServiceDisruption: {
    inProd: true,
    name: 'rampsServiceDisruption',
    productionDefault: false,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  rewardsBitcoinEnabledExtension: {
    inProd: true,
    name: 'rewardsBitcoinEnabledExtension',
    productionDefault: false,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  rewardsEnabled: {
    inProd: true,
    name: 'rewardsEnabled',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.32.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  rewardsOnboardingEnabled: {
    inProd: true,
    name: 'rewardsOnboardingEnabled',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.32.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  rewardsTronEnabledExtension: {
    inProd: true,
    name: 'rewardsTronEnabledExtension',
    productionDefault: false,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  rwaTokensEnabled: {
    inProd: true,
    name: 'rwaTokensEnabled',
    productionDefault: true,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  sendRedesign: {
    inProd: true,
    name: 'sendRedesign',
    productionDefault: {
      enabled: true,
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  sentry: {
    inProd: true,
    name: 'sentry',
    productionDefault: {},
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  settingsRedesign: {
    inProd: true,
    name: 'settingsRedesign',
    productionDefault: false,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  smartTransactionsAllowedRpcHosts: {
    inProd: true,
    name: 'smartTransactionsAllowedRpcHosts',
    productionDefault: [
      '.infura.io',
      '.binance.org',
      'mainnet.base.org',
      'rpc.linea.build',
    ],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  smartTransactionsNetworks: {
    inProd: true,
    name: 'smartTransactionsNetworks',
    productionDefault: {
      '0x1': {
        expectedDeadline: 45,
        extensionActive: true,
        gaslessBridgeWith7702Enabled: false,
        maxDeadline: 160,
        sentinelUrl: 'https://tx-sentinel-ethereum-mainnet.api.cx.metamask.io',
      },
      '0x1237': {
        extensionActive: true,
        gaslessBridgeWith7702Enabled: false,
        sentinelUrl: 'https://tx-sentinel-robinhood-mainnet.api.cx.metamask.io',
      },
      '0x144': {
        extensionActive: false,
        sentinelUrl: 'https://tx-sentinel-zksync-mainnet.api.cx.metamask.io',
      },
      '0x2105': {
        extensionActive: true,
        gaslessBridgeWith7702Enabled: true,
        sentinelUrl: 'https://tx-sentinel-base-mainnet.api.cx.metamask.io',
      },
      '0x38': {
        extensionActive: true,
        gaslessBridgeWith7702Enabled: false,
        sentinelUrl: 'https://tx-sentinel-bsc-mainnet.api.cx.metamask.io',
      },
      '0x531': {
        extensionActive: false,
        sentinelUrl: 'https://tx-sentinel-sei-mainnet.api.cx.metamask.io',
      },
      '0x89': {
        extensionActive: true,
        gaslessBridgeWith7702Enabled: true,
        sentinelUrl: 'https://tx-sentinel-polygon-mainnet.api.cx.metamask.io',
      },
      '0x8f': {
        extensionActive: false,
        sentinelUrl: 'https://tx-sentinel-monad-mainnet.api.cx.metamask.io',
      },
      '0xa': {
        extensionActive: false,
        sentinelUrl: 'https://tx-sentinel-optimism-mainnet.api.cx.metamask.io',
      },
      '0xa4b1': {
        extensionActive: true,
        gaslessBridgeWith7702Enabled: true,
        sentinelUrl: 'https://tx-sentinel-arbitrum-mainnet.api.cx.metamask.io',
      },
      '0xa86a': {
        extensionActive: false,
        sentinelUrl: 'https://tx-sentinel-avalanche-mainnet.api.cx.metamask.io',
      },
      '0xe708': {
        extensionActive: true,
        gaslessBridgeWith7702Enabled: true,
        sentinelUrl: 'https://tx-sentinel-linea-mainnet.api.cx.metamask.io',
      },
      default: {
        batchStatusPollingInterval: 1000,
        expectedDeadline: 45,
        extensionActive: false,
        extensionReturnTxHashAsap: true,
        extensionReturnTxHashAsapBatch: true,
        extensionSkipSmartTransactionStatusPage: false,
        gaslessBridgeWith7702Enabled: false,
        maxDeadline: 150,
      },
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  solanaCardEnabled: {
    inProd: true,
    name: 'solanaCardEnabled',
    productionDefault: false,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  solanaTestnetsEnabled: {
    inProd: true,
    name: 'solanaTestnetsEnabled',
    productionDefault: false,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  stableTokens: {
    inProd: true,
    name: 'stableTokens',
    productionDefault: {
      enabled: false,
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  staticAssetsPollingOptions: {
    inProd: true,
    name: 'staticAssetsPollingOptions',
    productionDefault: {
      cacheExpirationTime: 3600000,
      interval: 10800000,
      occurrenceFloor: {},
      supportedChains: ['0x10e6'],
      topX: 5,
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  stellarAccounts: {
    inProd: true,
    name: 'stellarAccounts',
    productionDefault: {
      enabled: false,
      minimumVersion: '0.0.1',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  stxMigrationBatchStatus: {
    inProd: true,
    name: 'stxMigrationBatchStatus',
    productionDefault: [
      {
        name: 'sentinel on',
        scope: {
          type: 'threshold',
          value: 1,
        },
        value: true,
      },
      {
        name: 'sentinel off',
        scope: {
          type: 'threshold',
          value: 0,
        },
        value: false,
      },
    ],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  stxMigrationCancel: {
    inProd: true,
    name: 'stxMigrationCancel',
    productionDefault: [
      {
        name: 'sentinel on',
        scope: {
          type: 'threshold',
          value: 1,
        },
        value: true,
      },
      {
        name: 'sentinel off',
        scope: {
          type: 'threshold',
          value: 0,
        },
        value: false,
      },
    ],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  stxMigrationGetFees: {
    inProd: true,
    name: 'stxMigrationGetFees',
    productionDefault: [
      {
        name: 'sentinel on',
        scope: {
          type: 'threshold',
          value: 1,
        },
        value: true,
      },
      {
        name: 'sentinel off',
        scope: {
          type: 'threshold',
          value: 0,
        },
        value: false,
      },
    ],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  stxMigrationSubmitTransactions: {
    inProd: true,
    name: 'stxMigrationSubmitTransactions',
    productionDefault: [
      {
        name: 'sentinel on',
        scope: {
          type: 'threshold',
          value: 1,
        },
        value: true,
      },
      {
        name: 'sentinel off',
        scope: {
          type: 'threshold',
          value: 0,
        },
        value: false,
      },
    ],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  swapsChainValueOrderOverride: {
    inProd: true,
    name: 'swapsChainValueOrderOverride',
    productionDefault: {
      positionOverrides: [],
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  swapsSWAPS4827AbtestChainValueOrder: {
    inProd: true,
    name: 'swapsSWAPS4827AbtestChainValueOrder',
    productionDefault: [],
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  tempoConfig: {
    inProd: true,
    name: 'tempoConfig',
    productionDefault: {
      enabled: false,
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  tronAccounts: {
    inProd: true,
    name: 'tronAccounts',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.13.2',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  vipProgramEnabled: {
    inProd: true,
    name: 'vipProgramEnabled',
    productionDefault: {
      enabled: true,
      minimumVersion: '13.36.0',
    },
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },

  walletFrameworkRpcFailoverEnabled: {
    inProd: true,
    name: 'walletFrameworkRpcFailoverEnabled',
    productionDefault: true,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },
  productSafetyScamQuestionnaireDomainList: {
    name: 'productSafetyScamQuestionnaireDomainList',
    type: FeatureFlagType.Remote,
    inProd: false,
    productionDefault: [],
    status: FeatureFlagStatus.Active,
  },
};
/* eslint-enable @typescript-eslint/naming-convention */

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Returns the production flag defaults in the raw API response format
 * (array of single-key objects), suitable for use by mock-e2e.js.
 *
 * Only includes remote flags that are in production.
 *
 * @returns Array of `{ flagName: value }` objects matching the client-config API format
 */
export function getProductionRemoteFlagApiResponse(): Json[] {
  return Object.values(FEATURE_FLAG_REGISTRY)
    .filter((entry) => entry.type === FeatureFlagType.Remote && entry.inProd)
    .map((entry) => ({ [entry.name]: entry.productionDefault }));
}

/**
 * Returns production flag defaults as a flat key-value map.
 * This is the "resolved" format used in Redux state (after the controller
 * processes the API response).
 *
 * Useful for assertions in E2E tests and for FixtureBuilder.withRemoteFeatureFlags().
 *
 * @returns Record of flag name to production default value
 */
export function getProductionRemoteFlagDefaults(): Record<string, Json> {
  const defaults: Record<string, Json> = {};
  for (const entry of Object.values(FEATURE_FLAG_REGISTRY)) {
    if (entry.type === FeatureFlagType.Remote && entry.inProd) {
      defaults[entry.name] = entry.productionDefault;
    }
  }
  return defaults;
}

/**
 * Gets a single registry entry by flag name.
 *
 * @param name - The flag identifier
 * @returns The registry entry, or undefined if not found
 */
export function getRegistryEntry(
  name: string,
): FeatureFlagRegistryEntry | undefined {
  return FEATURE_FLAG_REGISTRY[name];
}

/**
 * Resolves a registry entry to a boolean value.
 *
 * Supports plain booleans, version-gated objects, and rollout wrappers via
 * shared `getBooleanFeatureFlag` semantics.
 *
 * @param name - The flag identifier
 * @param defaultValue - Value to return when flag is missing or invalid
 * @returns The resolved boolean value
 */
export function getRegistryBooleanFlag(
  name: string,
  defaultValue = false,
): boolean {
  const entry = getRegistryEntry(name);

  return getBooleanFeatureFlag(entry?.productionDefault, defaultValue);
}

/**
 * Returns all flag names in the registry.
 *
 * @returns Array of flag name strings
 */
export function getRegisteredFlagNames(): string[] {
  return Object.keys(FEATURE_FLAG_REGISTRY);
}

/**
 * Returns all registry entries matching the given status.
 *
 * @param status - The status to filter by
 * @returns Array of matching registry entries
 */
export function getRegistryEntriesByStatus(
  status: FeatureFlagStatus,
): FeatureFlagRegistryEntry[] {
  return Object.values(FEATURE_FLAG_REGISTRY).filter(
    (entry) => entry.status === status,
  );
}

/**
 * Returns all deprecated flags. Useful for tracking flags that need removal.
 *
 * @returns Array of deprecated registry entries
 */
export function getDeprecatedFlags(): FeatureFlagRegistryEntry[] {
  return getRegistryEntriesByStatus(FeatureFlagStatus.Deprecated);
}
