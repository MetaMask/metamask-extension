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
import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';

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
 * Production defaults last synced: 2026-04-14
 * Source: https://client-config.api.cx.metamask.io/v1/flags?client=extension&distribution=main&environment=prod
 */
export const FEATURE_FLAG_REGISTRY: Record<string, FeatureFlagRegistryEntry> = {
  addBitcoinAccount: {
    name: 'addBitcoinAccount',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: false,
    status: FeatureFlagStatus.Active,
  },

  addBitcoinAccountDummyFlag: {
    name: 'addBitcoinAccountDummyFlag',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: false,
    status: FeatureFlagStatus.Active,
  },

  addSolanaAccount: {
    name: 'addSolanaAccount',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: true,
    status: FeatureFlagStatus.Active,
  },

  bitcoinAccounts: {
    name: 'bitcoinAccounts',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      enabled: true,
      minimumVersion: '13.9.0',
    },
    status: FeatureFlagStatus.Active,
  },

  bitcoinTestnetsEnabled: {
    name: 'bitcoinTestnetsEnabled',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: false,
    status: FeatureFlagStatus.Active,
  },

  enableMultichainAccounts: {
    name: 'enableMultichainAccounts',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      minimumVersion: '13.0.0',
      enabled: true,
      featureVersion: '1',
    },
    status: FeatureFlagStatus.Active,
  },

  enableMultichainAccountsState2: {
    name: 'enableMultichainAccountsState2',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      featureVersion: '2',
      minimumVersion: '13.5.0',
      enabled: true,
    },
    status: FeatureFlagStatus.Active,
  },

  isSolanaBuyable: {
    name: 'isSolanaBuyable',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: false,
    status: FeatureFlagStatus.Active,
  },

  solanaCardEnabled: {
    name: 'solanaCardEnabled',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: false,
    status: FeatureFlagStatus.Active,
  },

  solanaTestnetsEnabled: {
    name: 'solanaTestnetsEnabled',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: false,
    status: FeatureFlagStatus.Active,
  },

  tronAccounts: {
    name: 'tronAccounts',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      enabled: true,
      minimumVersion: '13.13.2',
    },
    status: FeatureFlagStatus.Active,
  },
  additionalNetworksBlacklist: {
    name: 'additionalNetworksBlacklist',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: [],
    status: FeatureFlagStatus.Active,
  },

  assetsAccountApiBalances: {
    name: 'assetsAccountApiBalances',
    type: FeatureFlagType.Remote,
    inProd: true,
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
  },

  assetsDefiPositionsEnabled: {
    name: 'assetsDefiPositionsEnabled',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: true,
    status: FeatureFlagStatus.Active,
  },

  assetsEnableNotificationsByDefault: {
    name: 'assetsEnableNotificationsByDefault',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: false,
    status: FeatureFlagStatus.Active,
  },

  assetsEnableNotificationsByDefaultV2: {
    name: 'assetsEnableNotificationsByDefaultV2',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: [
      {
        value: true,
        name: 'feature is ON',
        scope: { type: 'threshold', value: 1 },
      },
      {
        scope: { type: 'threshold', value: 0 },
        value: false,
        name: 'feature is OFF',
      },
    ],
    status: FeatureFlagStatus.Active,
  },

  assetsUnifyState: {
    name: 'assetsUnifyState',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      versions: {
        '13.15.0': {
          featureVersion: null,
          minimumVersion: null,
          enabled: false,
        },
      },
    },
    status: FeatureFlagStatus.Active,
  },

  staticAssetsPollingOptions: {
    name: 'staticAssetsPollingOptions',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      topX: 5,
      cacheExpirationTime: 3600000,
      interval: 10800000,
      occurrenceFloor: {},
      supportedChains: ['0x10e6'],
    },
    status: FeatureFlagStatus.Active,
  },
  bridgeConfig: {
    name: 'bridgeConfig',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      bip44DefaultPairs: {
        bip122: {
          standard: {
            'bip122:000000000019d6689c085ae165831e93/slip44:0':
              'eip155:1/slip44:60',
          },
          other: {},
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
      priceImpactThreshold: {
        gasless: 0.2,
        normal: 0.05,
      },
      chains: {
        '1': {
          topAssets: ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'],
          isActiveDest: true,
          isActiveSrc: true,
          isGaslessSwapEnabled: true,
          isSingleSwapBridgeButtonEnabled: true,
          noFeeAssets: [],
          stablecoins: [
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            '0xdac17f958d2ee523a2206206994597c13d831ec7',
          ],
        },
        '10': {
          stablecoins: [
            '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
            '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
            '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
          ],
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
        },
        '56': {
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: [
            '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
            '0x55d398326f99059ff775485246999027b3197955',
          ],
          isActiveDest: true,
          isActiveSrc: true,
          isGaslessSwapEnabled: true,
        },
        '137': {
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: [
            '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
            '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
            '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
          ],
          isActiveDest: true,
        },
        '143': {
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
        },
        '324': {
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: [
            '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4',
            '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4',
            '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C',
          ],
          isActiveDest: true,
        },
        '999': {
          stablecoins: ['0xb88339CB7199b77E23DB6E890353E22632Ba630f'],
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
        },
        '1329': {
          stablecoins: ['0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1'],
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
        },
        '4326': {
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: ['0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb'],
          isActiveDest: true,
          isActiveSrc: true,
        },
        '8453': {
          stablecoins: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'],
          isActiveDest: true,
          isActiveSrc: true,
          isGaslessSwapEnabled: true,
          isSingleSwapBridgeButtonEnabled: true,
        },
        '42161': {
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: [
            '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
            '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
          ],
          isActiveDest: true,
          isActiveSrc: true,
        },
        '43114': {
          stablecoins: [
            '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
            '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
            '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
            '0xc7198437980c041c805a1edcba50c1ce5db95118',
          ],
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
        },
        '59144': {
          stablecoins: [
            '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
            '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
          ],
          topAssets: ['0x176211869ca2b568f2a7d4ee941e073a821ee1ff'],
          isActiveDest: true,
          isActiveSrc: true,
          isGaslessSwapEnabled: true,
          isSingleSwapBridgeButtonEnabled: true,
          noFeeAssets: [],
        },
        '728126428': {
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
        },
        '1151111081099710': {
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
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
          isSnapConfirmationEnabled: true,
          refreshRate: 10000,
        },
        '20000000000001': {
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
          isActiveDest: true,
        },
      },
      sse: {
        enabled: true,
        minimumVersion: '13.9.0',
      },
      support: true,
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
      ],
      chainRanking: [
        {
          chainId: 'eip155:1',
          name: 'Ethereum',
        },
        {
          name: 'BNB Chain',
          chainId: 'eip155:56',
        },
        {
          chainId: 'bip122:000000000019d6689c085ae165831e93',
          name: 'BTC',
        },
        {
          name: 'Solana',
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        },
        {
          name: 'Tron',
          chainId: 'tron:728126428',
        },
        {
          name: 'Base',
          chainId: 'eip155:8453',
        },
        {
          name: 'Arbitrum',
          chainId: 'eip155:42161',
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
          name: 'Avalanche',
          chainId: 'eip155:43114',
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
      maxRefreshCount: 5,
      refreshRate: 30000,
      minimumVersion: '0.0.0',
    },
    status: FeatureFlagStatus.Active,
  },

  dappSwapMetrics: {
    name: 'dappSwapMetrics',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      enabled: true,
      origins: ['https://app.uniswap.org', 'https://metamask.github.io'],
      // eslint-disable-next-line @typescript-eslint/naming-convention
      bridge_quote_fees: 250,
    },
    status: FeatureFlagStatus.Active,
  },

  dappSwapQa: {
    name: 'dappSwapQa',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: { enabled: false },
    status: FeatureFlagStatus.Active,
  },

  dappSwapUi: {
    name: 'dappSwapUi',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: { enabled: false },
    status: FeatureFlagStatus.Active,
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  confirmations_eip_7702: {
    name: 'confirmations_eip_7702',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
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
        '0xa5bf',
        '0xaa044c',
        '0xaa36a7',
        '0xaa37dc',
        '0xe708',
      ],
      contracts: {
        '0x82': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Unichain Mainnet',
            signature:
              '0x54c423b1af4abbd1fb226e260dddba757acbcd8881e6b55b842c6b839874fa3f0e2f77685389ad5c28e096f12ef22557cebf6a77f6064baa071453a445a4c7d51c',
          },
        ],
        '0x1012': [
          {
            name: 'Citrea',
            signature:
              '0x6818c8c50d25e23dd3810758f3fc45d41c5444bec8fe0983660387414fab00366f6d8a0462b2e8985c16cdff5898d6bf9787e255b1a668d083728b448a5c3f641c',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
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
        '0x3909': [
          {
            name: 'Sonic Testnet',
            signature:
              '0xc092cc0bcf804f95eb659d281c00586bc72018a242d66fefacdc33a990faf99478c368612277cbbf72aee4a10b7ace6d8666f2c8c4fece9daada40cb360190631b',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
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
        '0x138c5': [
          {
            name: 'Berachain Testnet',
            signature:
              '0x66940bcb2c4b95ec2c1c1024fee1e3a8e51c8f072a52a9f0252a793604c8a6ba58ac3153d4dd041873d33eec349450c4a9acd51ddaed117bee448ed7a388208c1b',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
          },
        ],
        '0x1079': [
          {
            name: 'Tempo',
            signature:
              '0x810496170fb570d0d976c58273ad4a423252bac1f2e10c8a63adbbbfc4e79d2c5d894bae20c28e90a577338e68506138ac6dea142a1e80a31c0c2dd2999efa651b',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
          },
        ],
        '0x89': [
          {
            name: 'Polygon',
            signature:
              '0x302aa2d59940e88f35d2fa140fe6a1e9dc682218a444a7fb2d88f007fbe7792b2b8d615f5ae1e4f184533a02c47d8ac0f6ba3f591679295dff93c65095c0f03d1b',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
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
        '0x531': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Sei Mainnet',
            signature:
              '0xde089fc9af662bc4b0f873e4dc79760f6c3539f6f1cf32d9bc46baccf86ebae070a9062436f29ee86d04cc55699b27579f657922a2292ec2f1c5170d587917401b',
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
        '0x13fb': [
          {
            name: 'Citrea Testnet',
            signature:
              '0xf9e4aa35fc098468212352c2b9662022f9565bd713ca66e634c804f9820b5e0c266d710afba58aed00e5b7e24134dd9b52e2e331076de745137531a6d245a7521b',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
          },
        ],
        '0x138de': [
          {
            signature:
              '0x2c2037ddedcdfb9b7d8ea7c546259eef371a86b0e3610192eb15ece0114c59d86134791cd9e9df4208bbbdc83776d80b30b1fea6bf1a05bb072575217492497a1b',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Berachain',
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
        '0x18c6': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'MegaEth Testnet',
            signature:
              '0x6743135a8dfc8f58133d827b4997bc5316c8eb92883d2704a30b1d8a7bf494ce226b523e5f85a681eb5de8349c9564e62d389876d0e5fe5cc06fb9412d9d1cb61b',
          },
        ],
        '0x88bb0': [
          {
            signature:
              '0x23de8eb645a65b08721e5d2194063acead5f5f818474b7884ae767c7aaf9bb9b22233ab92684bc41087f8509e945d96083124ae1919a9357f2ae65267df4f0e21b',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Hoodi Testnet',
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
        '0x1': [
          {
            signature:
              '0xffb37facfedf12f1e98b56203de1c855391b791a20ee361234c546f4b50eb11853283cfc311419049f0325ad0a806ec232cc519073e3b5d4ad59ff331964d2e71b',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Mainnet',
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
        '0x19': [
          {
            signature:
              '0xa1856ef8c948b0a5204da687d53231848de2a585def9faac05c23c47412615dc476db943010164356b1d2ca8a8a66a8b0ae2d30c11b6b2aaf1cca116f0a333761c',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Cronos',
          },
        ],
        '0xaa37dc': [
          {
            signature:
              '0xa60cab833af6a8aa2dcc80d5e12d9e1566edb6cdf51c38e7cf43d441dac561007f05643e73e6b00107e18dbf15de98aae14192306276e92d654f62bd7c3023241c',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Optimism Sepolia',
          },
        ],
        '0x515': [
          {
            name: 'Unichain Sepolia',
            signature:
              '0x64487330691a05700a2321ee1db4092adce9590e7aded6e489df024838ecec734c935d182f74883818cb7659d5c784163573afdf8221252fa68d960cbe1c312f1b',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
          },
        ],
        '0x92': [
          {
            name: 'Sonic Mainnet',
            signature:
              '0x9f2a94332f2b71bff8a772053f47dbb65e26e5286341be0a3c55270d5549351f1dddb7566be0619b0150d42d540b0847cb0acbd0ab118ff608a40a18400834711b',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
          },
        ],
        '0x64': [
          {
            signature:
              '0xd0cfc2959c866e5218faf675f852e0c7021a454064e509d40256c5bec395e300381c19dcbec2e921b2f6d7d9a925a39dee8ea2e8dd8f595633b8dc333d91f1af1b',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Gnosis',
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
        '0x61': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'BNB Testnet',
            signature:
              '0x80aaf42c70b0b9efdf26e38ced69fce70f6b4f5496e7e59888819c14fb16290301ad049299d99e3650fa1a616a87bb80eb52ae9f02ddd8b53dd6b983275d0eb61b',
          },
        ],
        '0x66eee': [
          {
            name: 'Arbitrum Sepolia',
            signature:
              '0x6fdb53ecf8f575b85ff9895277b1f8e11349970fbb42225fe41587a072bbcef43e8d54303c4e1aa38d44cae9ba2c8bf825e9e138176d6b09a729cd82a14356cf1b',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
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
        '0xaa36a7': [
          {
            name: 'Sepolia - Official',
            signature:
              '0x1aba1c0dafadab6663efdd6086764a9b9fa5ab5c002e88ebae85edea162fbc425c398b2b93afdc036503f12361c05a7ff0b409ee523d5277e0b4d0a840679e591c',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
          },
          {
            address: '0xCd8D6C5554e209Fbb0deC797C6293cf7eAE13454',
            name: 'Sepolia - Testing',
            signature:
              '0x016cf109489c415ba28e695eb3cb06ac46689c5c49e2aba101d7ec2f68c890282563b324f5c8df5e0536994451825aa235438b7346e8c18b4e64161d990781891c',
          },
        ],
        '0x2105': [
          {
            signature:
              '0xbdddd2e925cf2cc7e148d3c11b02c917995fba8f3a3dc0b73c0059d029feca88014e723b8a32b2310a60c5b1cc17dfb3ae180b5a39f1d3264f985314b9168e0a1c',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Base',
          },
        ],
        '0xa5bf': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Tempo Testnet',
            signature:
              '0x2413338e5c47c56853195d1870988d721ec502c78e54fe5b98468a401538b942237a2769461ffbfa8269936bf309243d5b0d69f7114938653469c4d8225715ee1c',
          },
        ],
        '0xaa044c': [
          {
            name: 'Celo Sepolia',
            signature:
              '0x1590458cdfa10225e4fe734ed44deec95ac1887c877e63deb5ad35b41025c9ef2f33666cdd2c189b1999a78072ab9f8f122d93a52eaf12687fb2ff5b74d8de9f1c',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
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
        '0x27d8': [
          {
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            name: 'Chiado',
            signature:
              '0x0ff531d6afcc191c3b3bdffc1596d9ce8d1d52fa500ea2097c0823820a66f97963b88b646d4d4edbc0f781127d7985b87132d89c62c3cb4ad42848ce289645fa1b',
          },
        ],
        '0xa4ec': [
          {
            name: 'Celo Mainnet',
            signature:
              '0x1421ea4d014170a4fc5d0559f267974f4aa095a6e6047b107eff1807afa425774775f796a52a90b767810eade3b5919087bb361651a7b8f4f9679f1f46adb60e1b',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
          },
        ],
        '0x530': [
          {
            name: 'Sei Testnet',
            signature:
              '0x91135fcd7bfb9e2456c227ff12905128c3854db36775278d47b96c3c669f730c4063e3a62d94884617769bbad2868f35d725cb3b611d9bd1231bceb5967724711c',
            address: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
          },
        ],
      },
    },
    status: FeatureFlagStatus.Active,
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  confirmations_gas_buffer: {
    name: 'confirmations_gas_buffer',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      default: 1,
      included: 1.5,
      perChainConfig: {
        '0x2105': { eip7702: 1.3, name: 'base' },
        '0x38': { eip7702: 1.3, name: 'bnb' },
        '0xa': { name: 'optimism', eip7702: 1.3 },
        '0xa4b1': { base: 1.2, name: 'arbitrum' },
        '0x18c6': { base: 1.3, name: 'megaeth' },
        '0x18c7': { base: 1.3, name: 'megaeth' },
      },
    },
    status: FeatureFlagStatus.Active,
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  confirmations_incoming_transactions: {
    name: 'confirmations_incoming_transactions',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      useBackendWebSocketService: true,
    },
    status: FeatureFlagStatus.Active,
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  confirmations_transactions: {
    name: 'confirmations_transactions',
    type: FeatureFlagType.Remote,
    inProd: true,
    // Contains acceleratedPolling per-chain configs, batchSizeLimit, etc.
    // Storing simplified version; full value has ~100 chain entries.
    productionDefault: {
      gasFeeRandomisation: {
        randomisedGasFeeDigits: {
          '0x2105': 5,
        },
      },
      acceleratedPolling: {
        perChainConfig: {
          '0xe49b1': {
            name: 'LOGX',
            blockTime: 250,
            chainId: '936369',
            countMax: 15,
            intervalMs: 500,
          },
          '0x32': {
            countMax: 10,
            intervalMs: 1300,
            name: 'XDC',
            blockTime: 2000,
            chainId: '50',
          },
          '0xe4': {
            blockTime: 250,
            chainId: '228',
            countMax: 15,
            intervalMs: 500,
            name: 'MIND',
          },
          '0x6f0': {
            intervalMs: 500,
            name: 'INJECTIVE',
            blockTime: 667,
            chainId: '1776',
            countMax: 15,
          },
          '0x1331': {
            name: 'API3',
            blockTime: 250,
            chainId: '4913',
            countMax: 15,
            intervalMs: 500,
          },
          '0x7c5': {
            intervalMs: 500,
            name: 'LYDIA',
            blockTime: 250,
            chainId: '1989',
            countMax: 15,
          },
          '0x28c61': {
            intervalMs: 700,
            name: 'TAIKO_HEKLA',
            blockTime: 1000,
            chainId: '167009',
            countMax: 10,
          },
          '0x18c6': {
            countMax: 10,
            intervalMs: 700,
            name: 'MEGAETH_TESTNET',
            blockTime: 1000,
            chainId: '6342',
          },
          '0x531': {
            countMax: 15,
            intervalMs: 500,
            name: 'SEI',
            blockTime: 667,
            chainId: '1329',
          },
          '0xe705': {
            blockTime: 2000,
            chainId: '59141',
            countMax: 10,
            intervalMs: 1300,
            name: 'LINEA_SEPOLIA',
          },
          '0xfee': {
            intervalMs: 500,
            name: 'COMETH',
            blockTime: 250,
            chainId: '4078',
            countMax: 15,
          },
          '0xbde31': {
            chainId: '777777',
            countMax: 15,
            intervalMs: 500,
            name: 'WINR',
            blockTime: 250,
          },
          '0x8173': {
            blockTime: 250,
            chainId: '33139',
            countMax: 15,
            intervalMs: 500,
            name: 'APECHAIN',
          },
          '0xaa36a7': {
            blockTime: 12000,
            chainId: '11155111',
            countMax: 10,
            intervalMs: 3000,
            name: 'ETHEREUM_SEPOLIA',
          },
          '0x13e31': {
            blockTime: 2000,
            chainId: '81457',
            countMax: 10,
            intervalMs: 1300,
            name: 'BLAST',
          },
          '0x659': {
            blockTime: 250,
            chainId: '1625',
            countMax: 15,
            intervalMs: 500,
            name: 'GRAVITY',
          },
          '0xfa': {
            intervalMs: 2700,
            name: 'FANTOM',
            blockTime: 4000,
            chainId: '250',
            countMax: 10,
          },
          '0x11c3': {
            blockTime: 250,
            chainId: '4547',
            countMax: 15,
            intervalMs: 500,
            name: 'TRUMPCHAIN',
          },
          '0xf4290': {
            name: 'SCOREKOUNT',
            blockTime: 250,
            chainId: '1000080',
            countMax: 15,
            intervalMs: 500,
          },
          '0xfc': {
            chainId: '252',
            countMax: 10,
            intervalMs: 1300,
            name: 'FRAXTAL',
            blockTime: 2000,
          },
          '0x64': {
            name: 'GNOSIS',
            blockTime: 5000,
            chainId: '100',
            countMax: 10,
            intervalMs: 3000,
          },
          '0x88bb0': {
            intervalMs: 3000,
            name: 'HOODI',
            blockTime: 12000,
            chainId: '560048',
            countMax: 10,
          },
          '0x144': {
            name: 'ZKSYNC',
            blockTime: 1000,
            chainId: '324',
            countMax: 10,
            intervalMs: 700,
          },
          '0x725': {
            chainId: '1829',
            countMax: 15,
            intervalMs: 500,
            name: 'PLAYBLOCK',
            blockTime: 250,
          },
          '0x1042': {
            chainId: '4162',
            countMax: 15,
            intervalMs: 500,
            name: 'SX_ROLLUP',
            blockTime: 250,
          },
          '0x13a': {
            blockTime: 12000,
            chainId: '314',
            countMax: 10,
            intervalMs: 3000,
            name: 'FILECOIN',
          },
          '0x2272': {
            chainId: '8818',
            countMax: 15,
            intervalMs: 500,
            name: 'CLINK',
            blockTime: 250,
          },
          '0x10e6': {
            name: 'MEGAETH_MAINNET',
            blockTime: 1000,
            chainId: '4326',
            countMax: 10,
            intervalMs: 700,
          },
          '0x1ecf': {
            intervalMs: 500,
            name: 'KINTO',
            blockTime: 250,
            chainId: '7887',
            countMax: 15,
          },
          '0xb1c9': {
            countMax: 15,
            intervalMs: 500,
            name: 'BLESSNET',
            blockTime: 250,
            chainId: '45513',
          },
          '0x8279': {
            countMax: 15,
            intervalMs: 500,
            name: 'SLINGSHOTDAO',
            blockTime: 250,
            chainId: '33401',
          },
          '0xa6': {
            chainId: '166',
            countMax: 10,
            intervalMs: 900,
            name: 'OMNI',
            blockTime: 1333,
          },
          '0x82750': {
            blockTime: 1000,
            chainId: '534352',
            countMax: 10,
            intervalMs: 700,
            name: 'SCROLL',
          },
          '0xab5': {
            countMax: 10,
            intervalMs: 2700,
            name: 'ABSTRACT',
            blockTime: 4000,
            chainId: '2741',
          },
          '0x9dd': {
            name: 'INEVM',
            blockTime: 250,
            chainId: '2525',
            countMax: 15,
            intervalMs: 500,
          },
          '0x2a': {
            name: 'LUKSO',
            blockTime: 4000,
            chainId: '42',
            countMax: 10,
            intervalMs: 2700,
          },
          '0xb5f': {
            intervalMs: 500,
            name: 'HYTOPIA',
            blockTime: 250,
            chainId: '2911',
            countMax: 15,
          },
          '0x82': {
            name: 'UNICHAIN',
            blockTime: 2000,
            chainId: '130',
            countMax: 10,
            intervalMs: 1300,
          },
          '0x16fd8': {
            countMax: 15,
            intervalMs: 500,
            name: 'LUMITERRA',
            blockTime: 250,
            chainId: '94168',
          },
          '0x1b58': {
            countMax: 10,
            intervalMs: 2400,
            name: 'ZETACHAIN',
            blockTime: 3667,
            chainId: '7000',
          },
          '0x46f': {
            countMax: 10,
            intervalMs: 1300,
            name: 'LISK',
            blockTime: 2000,
            chainId: '1135',
          },
          '0x14a34': {
            countMax: 15,
            intervalMs: 500,
            name: 'BASE_SEPOLIA_TESTNET',
            blockTime: 250,
            chainId: '84532',
          },
          '0x1b254': {
            intervalMs: 500,
            name: 'REAL',
            blockTime: 250,
            chainId: '111188',
            countMax: 15,
          },
          '0x76adf1': {
            intervalMs: 1300,
            name: 'ZORA',
            blockTime: 2000,
            chainId: '7777777',
            countMax: 10,
          },
          '0xb67d2': {
            chainId: '747474',
            countMax: 10,
            intervalMs: 700,
            name: 'KATANA',
            blockTime: 1000,
          },
          '0x515': {
            chainId: '1301',
            countMax: 10,
            intervalMs: 1300,
            name: 'UNICHAIN_SEPOLIA',
            blockTime: 2000,
          },
          '0x1': {
            name: 'ETHEREUM',
            blockTime: 12000,
            chainId: '1',
            countMax: 10,
            intervalMs: 3000,
          },
          '0xa1337': {
            intervalMs: 500,
            name: 'XAI',
            blockTime: 250,
            chainId: '660279',
            countMax: 15,
          },
          '0x13882': {
            chainId: '80002',
            countMax: 10,
            intervalMs: 1100,
            name: 'POLYGON_AMOY',
            blockTime: 1667,
          },
          '0x89': {
            chainId: '137',
            countMax: 10,
            intervalMs: 1300,
            name: 'POLYGON',
            blockTime: 2000,
          },
          '0xa': {
            countMax: 10,
            intervalMs: 1300,
            name: 'OPTIMISM',
            blockTime: 2000,
            chainId: '10',
          },
          '0x13c23': {
            name: 'FORTA',
            blockTime: 250,
            chainId: '80931',
            countMax: 15,
            intervalMs: 500,
          },
          '0xc350': {
            blockTime: 250,
            chainId: '50000',
            countMax: 15,
            intervalMs: 500,
            name: 'CITRONUS',
          },
          '0xa4b1': {
            countMax: 15,
            intervalMs: 500,
            name: 'ARBITRUM_ONE',
            blockTime: 250,
            chainId: '42161',
          },
          '0xa33fc': {
            name: 'CONWAI',
            blockTime: 250,
            chainId: '668668',
            countMax: 15,
            intervalMs: 500,
          },
          '0x343b': {
            blockTime: 2000,
            chainId: '13371',
            countMax: 10,
            intervalMs: 1300,
            name: 'IMMUTABLE',
          },
          '0x171': {
            intervalMs: 3000,
            name: 'PULSECHAIN',
            blockTime: 10000,
            chainId: '369',
            countMax: 10,
          },
          '0x16876': {
            blockTime: 250,
            chainId: '92278',
            countMax: 15,
            intervalMs: 500,
            name: 'MIRACLE',
          },
          '0x2ba': {
            intervalMs: 1300,
            name: 'MATCHAIN',
            blockTime: 2000,
            chainId: '698',
            countMax: 10,
          },
          '0xe8': {
            intervalMs: 3000,
            name: 'LENS',
            blockTime: 25333,
            chainId: '232',
            countMax: 10,
          },
          '0x13881': {
            blockTime: 2000,
            chainId: '80001',
            countMax: 10,
            intervalMs: 1300,
            name: 'POLYGON_MUMBAI',
          },
          '0xa3c3': {
            name: 'EDUCHAIN',
            blockTime: 250,
            chainId: '41923',
            countMax: 15,
            intervalMs: 500,
          },
          '0xa0c71fd': {
            blockTime: 2000,
            chainId: '168587773',
            countMax: 10,
            intervalMs: 1300,
            name: 'BLAST_SEPOLIA',
          },
          '0x1142d': {
            chainId: '70701',
            countMax: 15,
            intervalMs: 500,
            name: 'PROOF_OF_PLAY_BOSS',
            blockTime: 250,
          },
          '0x9c4400': {
            countMax: 15,
            intervalMs: 500,
            name: 'ALIENX',
            blockTime: 250,
            chainId: '10241024',
          },
          '0x15eb': {
            name: 'OPBNB_TESTNET',
            blockTime: 1000,
            chainId: '5611',
            countMax: 10,
            intervalMs: 700,
          },
          '0x3bd': {
            chainId: '957',
            countMax: 10,
            intervalMs: 1300,
            name: 'LYRA',
            blockTime: 2000,
          },
          '0xb9': {
            countMax: 10,
            intervalMs: 1300,
            name: 'MINT',
            blockTime: 2000,
            chainId: '185',
          },
          '0x42af': {
            chainId: '17071',
            countMax: 15,
            intervalMs: 500,
            name: 'ONCHAIN_POINTS',
            blockTime: 250,
          },
          '0x15b43': {
            chainId: '88899',
            countMax: 15,
            intervalMs: 500,
            name: 'UNITE',
            blockTime: 250,
          },
          '0x128ca': {
            countMax: 15,
            intervalMs: 500,
            name: 'FUSION',
            blockTime: 250,
            chainId: '75978',
          },
          '0xa867': {
            chainId: '43111',
            countMax: 10,
            intervalMs: 800,
            name: 'HEMI',
            blockTime: 1200,
          },
          '0x13a43': {
            name: 'GEO_GENESIS',
            blockTime: 250,
            chainId: '80451',
            countMax: 15,
            intervalMs: 500,
          },
          '0x9c4401': {
            name: 'ALIENX_TESTNET',
            blockTime: 250,
            chainId: '10241025',
            countMax: 15,
            intervalMs: 500,
          },
          '0x2b2': {
            blockTime: 2000,
            chainId: '690',
            countMax: 10,
            intervalMs: 1300,
            name: 'REDSTONE',
          },
          '0x15a9': {
            intervalMs: 500,
            name: 'DUCK',
            blockTime: 250,
            chainId: '5545',
            countMax: 15,
          },
          '0x134b3cf': {
            blockTime: 250,
            chainId: '20231119',
            countMax: 15,
            intervalMs: 500,
            name: 'DERI',
          },
          '0x13bf8': {
            countMax: 15,
            intervalMs: 500,
            name: 'ONYX',
            blockTime: 250,
            chainId: '80888',
          },
          '0x2780b': {
            blockTime: 250,
            chainId: '161803',
            countMax: 15,
            intervalMs: 500,
            name: 'EVENTUM',
          },
          '0x1406f40': {
            countMax: 15,
            intervalMs: 500,
            name: 'CORN',
            blockTime: 250,
            chainId: '21000000',
          },
          '0x99797f': {
            blockTime: 250,
            chainId: '10058111',
            countMax: 15,
            intervalMs: 500,
            name: 'SPOTLIGHT',
          },
          '0xaa37dc': {
            intervalMs: 1300,
            name: 'OPTIMISM_SEPOLIA',
            blockTime: 2000,
            chainId: '11155420',
            countMax: 10,
          },
          '0x18232': {
            blockTime: 667,
            chainId: '98866',
            countMax: 15,
            intervalMs: 500,
            name: 'PLUME',
          },
          '0x279f': {
            blockTime: 500,
            chainId: '10143',
            countMax: 15,
            intervalMs: 500,
            name: 'MONAD_TESTNET',
          },
          '0x88b': {
            blockTime: 250,
            chainId: '2187',
            countMax: 15,
            intervalMs: 500,
            name: 'GAME7',
          },
          '0x28c58': {
            countMax: 10,
            intervalMs: 3000,
            name: 'TAIKO',
            blockTime: 6000,
            chainId: '167000',
          },
          '0x38': {
            blockTime: 667,
            chainId: '56',
            countMax: 15,
            intervalMs: 500,
            name: 'BNB',
          },
          '0xa86a': {
            countMax: 10,
            intervalMs: 700,
            name: 'AVALANCHE',
            blockTime: 1000,
            chainId: '43114',
          },
          '0x813df': {
            name: 'LAYER_K',
            blockTime: 250,
            chainId: '529375',
            countMax: 15,
            intervalMs: 500,
          },
          '0x3023': {
            intervalMs: 500,
            name: 'HUDDLE01',
            blockTime: 250,
            chainId: '12323',
            countMax: 15,
          },
          '0x5d979': {
            name: 'CHEESE',
            blockTime: 250,
            chainId: '383353',
            countMax: 15,
            intervalMs: 500,
          },
          '0x868b': {
            intervalMs: 1300,
            name: 'MODE',
            blockTime: 2000,
            chainId: '34443',
            countMax: 10,
          },
          '0x163e7': {
            blockTime: 250,
            chainId: '91111',
            countMax: 15,
            intervalMs: 500,
            name: 'HENEZ',
          },
          '0x316b8': {
            countMax: 15,
            intervalMs: 500,
            name: 'BLOCKFIT',
            blockTime: 250,
            chainId: '202424',
          },
          '0xa9': {
            chainId: '169',
            countMax: 10,
            intervalMs: 1300,
            name: 'MANTA',
            blockTime: 2000,
          },
          '0x19': {
            name: 'CRONOS',
            blockTime: 667,
            chainId: '25',
            countMax: 15,
            intervalMs: 500,
          },
          '0x2105': {
            name: 'BASE',
            blockTime: 2000,
            chainId: '8453',
            countMax: 10,
            intervalMs: 1300,
          },
          '0x138de': {
            chainId: '80094',
            countMax: 10,
            intervalMs: 1300,
            name: 'BERACHAIN',
            blockTime: 2000,
          },
          '0x2f0': {
            name: 'RIVALZ',
            blockTime: 250,
            chainId: '752',
            countMax: 15,
            intervalMs: 500,
          },
          '0x123': {
            countMax: 10,
            intervalMs: 1300,
            name: 'ORDERLY',
            blockTime: 2000,
            chainId: '291',
          },
          '0x3e7': {
            name: 'HYPEREVM',
            blockTime: 1000,
            chainId: '999',
            countMax: 10,
            intervalMs: 700,
          },
          '0xd0d0': {
            countMax: 15,
            intervalMs: 500,
            name: 'DODO',
            blockTime: 250,
            chainId: '53456',
          },
          '0xd7cc': {
            blockTime: 250,
            chainId: '55244',
            countMax: 15,
            intervalMs: 500,
            name: 'SUPERPOSITION',
          },
          '0x27bc86aa': {
            countMax: 15,
            intervalMs: 500,
            name: 'DEGEN_CHAIN',
            blockTime: 250,
            chainId: '666666666',
          },
          '0x52415249': {
            intervalMs: 500,
            name: 'RARIBLE',
            blockTime: 250,
            chainId: '1380012617',
            countMax: 15,
          },
          '0x974': {
            countMax: 15,
            intervalMs: 500,
            name: 'DOGELON',
            blockTime: 250,
            chainId: '2420',
          },
          '0xa4ba': {
            countMax: 15,
            intervalMs: 500,
            name: 'ARBITRUM_NOVA',
            blockTime: 250,
            chainId: '42170',
          },
          '0x62ef': {
            chainId: '25327',
            countMax: 15,
            intervalMs: 500,
            name: 'EVERCLEAR',
            blockTime: 250,
          },
          '0xa1ef': {
            chainId: '41455',
            countMax: 15,
            intervalMs: 500,
            name: 'ALEPH_ZERO',
            blockTime: 250,
          },
          '0x7ea': {
            name: 'EDGELESS',
            blockTime: 2000,
            chainId: '2026',
            countMax: 10,
            intervalMs: 1300,
          },
          '0x74c': {
            name: 'SONEIUM',
            blockTime: 2000,
            chainId: '1868',
            countMax: 10,
            intervalMs: 1300,
          },
          '0xe34': {
            chainId: '3636',
            countMax: 10,
            intervalMs: 3000,
            name: 'BOTANIX_TESTNET',
            blockTime: 6000,
          },
          '0xe35': {
            countMax: 10,
            intervalMs: 3000,
            name: 'BOTANIX',
            blockTime: 5667,
            chainId: '3637',
          },
          '0x7cc': {
            name: 'SANKO',
            blockTime: 250,
            chainId: '1996',
            countMax: 15,
            intervalMs: 500,
          },
          '0x61': {
            countMax: 10,
            intervalMs: 700,
            name: 'BNB_TESTNET',
            blockTime: 1000,
            chainId: '97',
          },
          '0x2eb': {
            blockTime: 1000,
            chainId: '747',
            countMax: 10,
            intervalMs: 700,
            name: 'FLOW',
          },
          '0xcc': {
            chainId: '204',
            countMax: 10,
            intervalMs: 700,
            name: 'OPBNB',
            blockTime: 1000,
          },
          '0x8f': {
            chainId: '143',
            countMax: 15,
            intervalMs: 500,
            name: 'MONAD',
            blockTime: 500,
          },
          '0x34fb5e38': {
            intervalMs: 1300,
            name: 'ANXIENT8',
            blockTime: 2000,
            chainId: '888888888',
            countMax: 10,
          },
          '0x6c1': {
            intervalMs: 500,
            name: 'REYA',
            blockTime: 250,
            chainId: '1729',
            countMax: 15,
          },
          '0x1142c': {
            intervalMs: 500,
            name: 'PROOF_OF_PLAY_APEX',
            blockTime: 250,
            chainId: '70700',
            countMax: 15,
          },
          '0x8274f': {
            name: 'SCROLL_SEPOLIA',
            blockTime: 3667,
            chainId: '534351',
            countMax: 10,
            intervalMs: 2400,
          },
          '0x18c7': {
            name: 'MEGAETH_TESTNET_V2',
            blockTime: 1000,
            chainId: '6343',
            countMax: 10,
            intervalMs: 700,
          },
          '0xe708': {
            countMax: 10,
            intervalMs: 1300,
            name: 'LINEA',
            blockTime: 2000,
            chainId: '59144',
          },
          '0x13f8': {
            chainId: '5112',
            countMax: 10,
            intervalMs: 1300,
            name: 'HAM',
            blockTime: 2000,
          },
          '0x98967f': {
            intervalMs: 500,
            name: 'FLUENCE',
            blockTime: 250,
            chainId: '9999999',
            countMax: 15,
          },
          '0x142b6': {
            intervalMs: 500,
            name: 'VEMP',
            blockTime: 250,
            chainId: '82614',
            countMax: 15,
          },
          '0x4268': {
            chainId: '17000',
            countMax: 10,
            intervalMs: 3000,
            name: 'ETHEREUM_HOLESKY',
            blockTime: 12000,
          },
          '0x2611': {
            blockTime: 1000,
            chainId: '9745',
            countMax: 10,
            intervalMs: 700,
            name: 'PLASMA',
          },
          '0xca74': {
            countMax: 15,
            intervalMs: 500,
            name: 'CHAINBOUNTY',
            blockTime: 250,
            chainId: '51828',
          },
          '0x1713c': {
            intervalMs: 500,
            name: 'IDEX',
            blockTime: 250,
            chainId: '94524',
            countMax: 15,
          },
          '0x1388': {
            intervalMs: 1300,
            name: 'MANTLE',
            blockTime: 2000,
            chainId: '5000',
            countMax: 10,
          },
          '0x1b59': {
            intervalMs: 2000,
            name: 'ZETACHAIN_TESTNET',
            blockTime: 3000,
            chainId: '7001',
            countMax: 10,
          },
          '0x34a1': {
            name: 'IMMUTABLE_TESTNET',
            blockTime: 2000,
            chainId: '13473',
            countMax: 10,
            intervalMs: 1300,
          },
        },
        defaultCountMax: 10,
        defaultIntervalMs: 3000,
      },
      batchSizeLimit: 10,
      gasEstimateFallback: {
        perChainConfig: {
          '0x279f': {
            fixed: 1000000,
          },
        },
      },
    },
    status: FeatureFlagStatus.Active,
  },
  smartTransactionsNetworks: {
    name: 'smartTransactionsNetworks',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      '0xa86a': {
        extensionActive: false,
        sentinelUrl: 'https://tx-sentinel-avalanche-mainnet.api.cx.metamask.io',
      },
      '0x2105': {
        extensionActive: true,
        gaslessBridgeWith7702Enabled: true,
        sentinelUrl: 'https://tx-sentinel-base-mainnet.api.cx.metamask.io',
      },
      '0xe708': {
        sentinelUrl: 'https://tx-sentinel-linea-mainnet.api.cx.metamask.io',
        extensionActive: true,
        gaslessBridgeWith7702Enabled: false,
      },
      '0x89': {
        extensionActive: true,
        gaslessBridgeWith7702Enabled: true,
        sentinelUrl: 'https://tx-sentinel-polygon-mainnet.api.cx.metamask.io',
      },
      '0x1': {
        maxDeadline: 160,
        sentinelUrl: 'https://tx-sentinel-ethereum-mainnet.api.cx.metamask.io',
        expectedDeadline: 45,
        extensionActive: true,
        gaslessBridgeWith7702Enabled: false,
      },
      '0xa4b1': {
        gaslessBridgeWith7702Enabled: true,
        sentinelUrl: 'https://tx-sentinel-arbitrum-mainnet.api.cx.metamask.io',
        extensionActive: true,
      },
      default: {
        maxDeadline: 150,
        batchStatusPollingInterval: 1000,
        expectedDeadline: 45,
        extensionActive: false,
        extensionReturnTxHashAsap: true,
        extensionReturnTxHashAsapBatch: true,
        extensionSkipSmartTransactionStatusPage: false,
        gaslessBridgeWith7702Enabled: false,
      },
      '0x531': {
        sentinelUrl: 'https://tx-sentinel-sei-mainnet.api.cx.metamask.io',
        extensionActive: false,
      },
      '0x144': {
        sentinelUrl: 'https://tx-sentinel-zksync-mainnet.api.cx.metamask.io',
        extensionActive: false,
      },
      '0xa': {
        extensionActive: false,
        sentinelUrl: 'https://tx-sentinel-optimism-mainnet.api.cx.metamask.io',
      },
      '0x38': {
        extensionActive: true,
        gaslessBridgeWith7702Enabled: false,
        sentinelUrl: 'https://tx-sentinel-bsc-mainnet.api.cx.metamask.io',
      },
      '0x8f': {
        extensionActive: false,
        sentinelUrl: 'https://tx-sentinel-monad-mainnet.api.cx.metamask.io',
      },
    },
    status: FeatureFlagStatus.Active,
  },
  backendWebSocketConnection: {
    name: 'backendWebSocketConnection',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: [
      {
        scope: { type: 'threshold', value: 1 },
        value: true,
        name: 'feature is ON',
      },
      {
        name: 'feature is OFF',
        scope: { type: 'threshold', value: 0 },
        value: false,
      },
    ],
    status: FeatureFlagStatus.Active,
  },
  configRegistryApiEnabled: {
    name: 'configRegistryApiEnabled',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: false,
    status: FeatureFlagStatus.Active,
  },

  extensionPlatformAutoReloadAfterUpdate: {
    name: 'extensionPlatformAutoReloadAfterUpdate',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: true,
    status: FeatureFlagStatus.Active,
  },

  platformSplitStateGradualRollout: {
    name: 'platformSplitStateGradualRollout',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: [
      {
        name: 'feature is ON',
        scope: {
          type: 'threshold',
          value: 1,
        },
        value: {
          maxAccounts: 99999,
          maxNetworks: 99999,
          enabled: 1,
        },
      },
    ],
    status: FeatureFlagStatus.Active,
  },

  walletFrameworkRpcFailoverEnabled: {
    name: 'walletFrameworkRpcFailoverEnabled',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: true,
    status: FeatureFlagStatus.Active,
  },
  carouselBanners: {
    name: 'carouselBanners',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: true,
    status: FeatureFlagStatus.Active,
  },

  contentfulCarouselEnabled: {
    name: 'contentfulCarouselEnabled',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: true,
    status: FeatureFlagStatus.Active,
  },

  extensionSignedDeepLinkWarningEnabled: {
    name: 'extensionSignedDeepLinkWarningEnabled',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: [
      {
        name: 'Warning enabled',
        scope: { value: 1, type: 'threshold' },
        value: true,
      },
    ],
    status: FeatureFlagStatus.Active,
  },

  extensionSkipTransactionStatusPage: {
    name: 'extensionSkipTransactionStatusPage',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      minimumVersion: '0.0.0',
      enabled: false,
    },
    status: FeatureFlagStatus.Active,
  },

  extensionUpdatePromptMinimumVersion: {
    name: 'extensionUpdatePromptMinimumVersion',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: '0.0.0',
    status: FeatureFlagStatus.Active,
  },

  extensionUxDefaultAddressVersioned: {
    name: 'extensionUxDefaultAddressVersioned',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      enabled: false,
      minimumVersion: '0.0.0',
    },
    status: FeatureFlagStatus.Active,
  },

  extensionUxDefiReferral: {
    name: 'extensionUxDefiReferral',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: true,
    status: FeatureFlagStatus.Active,
  },

  extensionUxDefiReferralPartners: {
    name: 'extensionUxDefiReferralPartners',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      asterdex: true,
      gmx: true,
      hyperliquid: true,
    },
    status: FeatureFlagStatus.Active,
  },

  extensionUxPna25: {
    name: 'extensionUxPna25',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: true,
    status: FeatureFlagStatus.Active,
  },

  extensionUxSidepanel: {
    name: 'extensionUxSidepanel',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: false,
    status: FeatureFlagStatus.Active,
  },

  neNetworkDiscoverButton: {
    name: 'neNetworkDiscoverButton',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
      '0x531': true,
      '0x8f': true,
      '0xe708': true,
    },
    status: FeatureFlagStatus.Active,
  },

  sendRedesign: {
    name: 'sendRedesign',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: { enabled: true },
    status: FeatureFlagStatus.Active,
  },
  gasFeesSponsoredNetwork: {
    name: 'gasFeesSponsoredNetwork',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      '0x38': false,
      '0x531': true,
      '0x8f': true,
    },
    status: FeatureFlagStatus.Active,
  },
  perpsEnabled: {
    name: 'perpsEnabled',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: false,
    status: FeatureFlagStatus.Active,
  },

  perpsEnabledVersion: {
    name: 'perpsEnabledVersion',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      enabled: false,
      minimumVersion: '13.15.0',
    },
    status: FeatureFlagStatus.Active,
  },

  perpsHip3AllowlistMarkets: {
    name: 'perpsHip3AllowlistMarkets',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: 'xyz:*',
    status: FeatureFlagStatus.Active,
  },
  rewardsBitcoinEnabledExtension: {
    name: 'rewardsBitcoinEnabledExtension',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: false,
    status: FeatureFlagStatus.Active,
  },

  rewardsEnabled: {
    name: 'rewardsEnabled',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      enabled: false,
      minimumVersion: '0.0.0',
    },
    status: FeatureFlagStatus.Active,
  },

  rewardsOnboardingEnabled: {
    name: 'rewardsOnboardingEnabled',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      enabled: false,
      minimumVersion: '0.0.0',
    },
    status: FeatureFlagStatus.Active,
  },

  rewardsTronEnabledExtension: {
    name: 'rewardsTronEnabledExtension',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: false,
    status: FeatureFlagStatus.Active,
  },

  rwaTokensEnabled: {
    name: 'rwaTokensEnabled',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: true,
    status: FeatureFlagStatus.Active,
  },

  nonZeroUnusedApprovals: {
    name: 'nonZeroUnusedApprovals',
    type: FeatureFlagType.Remote,
    inProd: true,
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
  },
  complianceEnabled: {
    name: 'complianceEnabled',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      enabled: false,
    },
    status: FeatureFlagStatus.Active,
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  confirmations_pay: {
    name: 'confirmations_pay',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      name: 'empty',
    },
    status: FeatureFlagStatus.Active,
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  confirmations_pay_dapps: {
    name: 'confirmations_pay_dapps',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      enabled: false,
    },
    status: FeatureFlagStatus.Active,
  },

  earnMerklCampaignClaiming: {
    name: 'earnMerklCampaignClaiming',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      enabled: true,
      minimumVersion: '13.24.0',
    },
    status: FeatureFlagStatus.Active,
  },

  earnMusdConversionAssetOverviewCtaEnabled: {
    name: 'earnMusdConversionAssetOverviewCtaEnabled',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      enabled: true,
      minimumVersion: '13.24.0',
    },
    status: FeatureFlagStatus.Active,
  },

  earnMusdConversionCtaTokens: {
    name: 'earnMusdConversionCtaTokens',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      '0x1': ['USDC', 'USDT', 'DAI'],
      '0xe708': ['USDC', 'USDT', 'DAI'],
    },
    status: FeatureFlagStatus.Active,
  },

  earnMusdConversionFlowEnabled: {
    name: 'earnMusdConversionFlowEnabled',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      minimumVersion: '13.26.0',
      enabled: true,
    },
    status: FeatureFlagStatus.Active,
  },

  earnMusdConversionGeoBlockedCountries: {
    name: 'earnMusdConversionGeoBlockedCountries',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      blockedRegions: ['GB'],
    },
    status: FeatureFlagStatus.Active,
  },

  earnMusdConversionMinAssetBalanceRequired: {
    name: 'earnMusdConversionMinAssetBalanceRequired',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: 0.01,
    status: FeatureFlagStatus.Active,
  },

  earnMusdConversionTokenListItemCtaEnabled: {
    name: 'earnMusdConversionTokenListItemCtaEnabled',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      enabled: true,
      minimumVersion: '13.24.0',
    },
    status: FeatureFlagStatus.Active,
  },

  earnMusdConvertibleTokensAllowlist: {
    name: 'earnMusdConvertibleTokensAllowlist',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      '0x1': ['USDC', 'USDT', 'DAI'],
      '0xe708': ['USDC', 'USDT', 'DAI'],
    },
    status: FeatureFlagStatus.Active,
  },

  earnMusdConvertibleTokensBlocklist: {
    name: 'earnMusdConvertibleTokensBlocklist',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {},
    status: FeatureFlagStatus.Active,
  },

  earnMusdCtaEnabled: {
    name: 'earnMusdCtaEnabled',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      minimumVersion: '13.24.0',
      enabled: true,
    },
    status: FeatureFlagStatus.Active,
  },

  perpsPerpTradingGeoBlockedCountriesV2: {
    name: 'perpsPerpTradingGeoBlockedCountriesV2',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      blockedRegions: ['BE', 'US', 'CA-ON', 'GB'],
    },
    status: FeatureFlagStatus.Active,
  },

  settingsRedesign: {
    name: 'settingsRedesign',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: false,
    status: FeatureFlagStatus.Active,
  },

  tempoConfig: {
    name: 'tempoConfig',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      enabled: false,
    },
    status: FeatureFlagStatus.Active,
  },

  stellarAccounts: {
    name: 'stellarAccounts',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      minimumVersion: '0.0.1',
      enabled: false,
    },
    status: FeatureFlagStatus.Active,
  },
  perpsHip3BlocklistMarkets: {
    name: 'perpsHip3BlocklistMarkets',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: 'variation 2',
    status: FeatureFlagStatus.Active,
  },
};

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
