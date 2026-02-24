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
 * Production defaults last synced: 2026-02-09
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
      minimumVersion: null,
      enabled: false,
      featureVersion: null,
    },
    status: FeatureFlagStatus.Active,
  },

  staticAssetsPollingOptions: {
    name: 'staticAssetsPollingOptions',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {},
    status: FeatureFlagStatus.Active,
  },
  bridgeConfig: {
    name: 'bridgeConfig',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      maxRefreshCount: 5,
      priceImpactThreshold: { gasless: 0.2, normal: 0.05 },
      bip44DefaultPairs: {
        solana: {
          other: {},
          standard: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501':
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          },
        },
        bip122: {
          standard: {
            'bip122:000000000019d6689c085ae165831e93/slip44:0':
              'eip155:1/slip44:60',
          },
          other: {},
        },
        eip155: {
          standard: {
            'eip155:1/slip44:60':
              'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          },
          other: {},
        },
      },
      sse: { enabled: true, minimumVersion: '13.9.0' },
      support: true,
      chainRanking: [
        { chainId: 'eip155:1', name: 'Ethereum' },
        { name: 'BNB Chain', chainId: 'eip155:56' },
        {
          name: 'BTC',
          chainId: 'bip122:000000000019d6689c085ae165831e93',
        },
        {
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          name: 'Solana',
        },
        { name: 'Tron', chainId: 'tron:728126428' },
        { chainId: 'eip155:8453', name: 'Base' },
        { name: 'Arbitrum', chainId: 'eip155:42161' },
        { chainId: 'eip155:59144', name: 'Linea' },
        { chainId: 'eip155:137', name: 'Polygon' },
        { name: 'Avalanche', chainId: 'eip155:43114' },
        { chainId: 'eip155:10', name: 'Optimism' },
        { name: 'Monad', chainId: 'eip155:143' },
        { name: 'Sei', chainId: 'eip155:1329' },
        { chainId: 'eip155:324', name: 'zkSync Era' },
      ],
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
      ],
      chains: {
        '1': {
          stablecoins: [
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            '0xdac17f958d2ee523a2206206994597c13d831ec7',
          ],
          topAssets: ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'],
          isActiveDest: true,
          isActiveSrc: true,
          isGaslessSwapEnabled: true,
          isSingleSwapBridgeButtonEnabled: true,
          noFeeAssets: [],
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
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: [
            '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
            '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
            '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
          ],
          isActiveDest: true,
          isActiveSrc: true,
        },
        '143': {
          isSingleSwapBridgeButtonEnabled: true,
          isActiveDest: true,
          isActiveSrc: true,
        },
        '324': {
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: [
            '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4',
            '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4',
            '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C',
          ],
          isActiveDest: true,
          isActiveSrc: true,
        },
        '1329': {
          stablecoins: ['0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1'],
          isActiveDest: true,
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
        },
        '8453': {
          isActiveDest: true,
          isActiveSrc: true,
          isGaslessSwapEnabled: true,
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'],
        },
        '42161': {
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
          stablecoins: [
            '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
            '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
          ],
          isActiveDest: true,
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
          isSingleSwapBridgeButtonEnabled: true,
          noFeeAssets: [],
          stablecoins: [
            '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
            '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
          ],
          topAssets: ['0x176211869ca2b568f2a7d4ee941e073a821ee1ff'],
          isActiveDest: true,
          isActiveSrc: true,
          isGaslessSwapEnabled: true,
        },
        '728126428': {
          isActiveSrc: true,
          isSingleSwapBridgeButtonEnabled: true,
          isActiveDest: true,
        },
        '1151111081099710': {
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
          isActiveDest: true,
          isActiveSrc: true,
        },
        '20000000000001': {
          isSingleSwapBridgeButtonEnabled: true,
          isActiveDest: true,
          isActiveSrc: true,
        },
      },
      minimumVersion: '0.0.0',
      refreshRate: 30000,
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
      contracts: {},
      supportedChains: [],
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
    productionDefault: {},
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
      acceleratedPolling: {
        defaultCountMax: 10,
        defaultIntervalMs: 3000,
        perChainConfig: {},
      },
      batchSizeLimit: 10,
      gasEstimateFallback: { perChainConfig: {} },
      gasFeeRandomisation: { randomisedGasFeeDigits: {} },
    },
    status: FeatureFlagStatus.Active,
  },
  smartTransactionsNetworks: {
    name: 'smartTransactionsNetworks',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      default: {
        expectedDeadline: 45,
        extensionActive: false,
        extensionReturnTxHashAsap: true,
        extensionReturnTxHashAsapBatch: true,
        extensionSkipSmartTransactionStatusPage: false,
        maxDeadline: 150,
        batchStatusPollingInterval: 1000,
      },
      '0x1': {
        expectedDeadline: 45,
        extensionActive: true,
        maxDeadline: 160,
        sentinelUrl: 'https://tx-sentinel-ethereum-mainnet.api.cx.metamask.io',
      },
      '0x89': {
        extensionActive: false,
        sentinelUrl: 'https://tx-sentinel-polygon-mainnet.api.cx.metamask.io',
      },
      '0xa4b1': {
        extensionActive: true,
        sentinelUrl: 'https://tx-sentinel-arbitrum-mainnet.api.cx.metamask.io',
      },
      '0x38': {
        extensionActive: true,
        sentinelUrl: 'https://tx-sentinel-bsc-mainnet.api.cx.metamask.io',
      },
      '0x2105': {
        extensionActive: true,
        sentinelUrl: 'https://tx-sentinel-base-mainnet.api.cx.metamask.io',
      },
      '0xa': {
        extensionActive: false,
        sentinelUrl: 'https://tx-sentinel-optimism-mainnet.api.cx.metamask.io',
      },
      '0xe708': {
        extensionActive: true,
        sentinelUrl: 'https://tx-sentinel-linea-mainnet.api.cx.metamask.io',
      },
      '0x531': {
        extensionActive: false,
        sentinelUrl: 'https://tx-sentinel-sei-mainnet.api.cx.metamask.io',
      },
      '0xa86a': {
        extensionActive: false,
        sentinelUrl: 'https://tx-sentinel-avalanche-mainnet.api.cx.metamask.io',
      },
      '0x144': {
        extensionActive: false,
        sentinelUrl: 'https://tx-sentinel-zksync-mainnet.api.cx.metamask.io',
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
          value: 0,
        },
        value: { maxAccounts: 0, maxNetworks: 0, enabled: 1 },
      },
      {
        scope: {
          type: 'threshold',
          value: { maxAccounts: 0, maxNetworks: 0, enabled: 0 },
        },
        value: { maxAccounts: 0, maxNetworks: 0 },
        name: 'feature is OFF',
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

  extensionUpdatePromptMinimumVersion: {
    name: 'extensionUpdatePromptMinimumVersion',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: '0.0.0',
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
      hyperliquid: true,
      gmx: false,
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

  settingsRedesign: {
    name: 'settingsRedesign',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: false,
    status: FeatureFlagStatus.Active,
  },
  gasFeesSponsoredNetwork: {
    name: 'gasFeesSponsoredNetwork',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      '0x38': false,
      '0x531': false,
      '0x8f': false,
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
  nonZeroUnusedApprovals: {
    name: 'nonZeroUnusedApprovals',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: [
      'https://aerodrome.finance',
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
    ],
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
