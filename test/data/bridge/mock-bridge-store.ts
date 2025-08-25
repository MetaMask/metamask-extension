import {
  getDefaultBridgeControllerState,
  formatChainIdToCaip,
} from '@metamask/bridge-controller';
import { DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE } from '@metamask/bridge-status-controller';
import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { CHAIN_IDS } from '../../../shared/constants/network';
import type { BridgeAppState } from '../../../ui/ducks/bridge/selectors';
import { createSwapsMockStore } from '../../jest/mock-store';
import { mockNetworkState } from '../../stub/networks';
import { mockTokenData } from './mock-token-data';

export const createBridgeMockStore = ({
  featureFlagOverrides = {},
  bridgeSliceOverrides = {},
  bridgeStateOverrides = {},
  bridgeStatusStateOverrides = {},
  metamaskStateOverrides = {},
  stateOverrides = {},
}: {
  // featureFlagOverrides?: Partial<BridgeControllerState['bridgeFeatureFlags']>;
  // bridgeSliceOverrides?: Partial<BridgeState>;
  // bridgeStateOverrides?: Partial<BridgeControllerState>;
  // bridgeStatusStateOverrides?: Partial<BridgeStatusState>;
  // metamaskStateOverrides?: Partial<BridgeAppState['metamask']>;
  // TODO replace these with correct types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  featureFlagOverrides?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bridgeSliceOverrides?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bridgeStateOverrides?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bridgeStatusStateOverrides?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metamaskStateOverrides?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stateOverrides?: Record<string, any>;
} = {}): BridgeAppState => {
  const {
    metamask: swapsMetamask,
    swaps,
    ...swapsStore
  } = createSwapsMockStore();
  const { internalAccounts: tokenInternalAccounts, ...tokenData } =
    mockTokenData;
  const {
    internalAccounts: internalAccountsOverrides,
    ...metamaskStateOverridesWithoutAccounts
  } = metamaskStateOverrides;
  const internalAccounts = {
    selectedAccount:
      internalAccountsOverrides?.selectedAccount ??
      swapsMetamask.internalAccounts.selectedAccount,
    accounts: {
      ...swapsMetamask.internalAccounts.accounts,
      ...tokenInternalAccounts.accounts,
      ...(internalAccountsOverrides?.accounts ?? {}),
      'bf13d52c-d6e8-40ea-9726-07d7149a3ca5': {
        type: 'solana:data-account',
        id: 'bf13d52c-d6e8-40ea-9726-07d7149a3ca5',
        address: 'ABCDEu4xsyvDpnqL5DQMVrh8AXxZKJPKJw5QsM7KEF8J',
        options: {
          scope: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          derivationPath: "m/44'/501'/0'/0'",
          entropySource: '01K2FF18CTTXJYD34R78X4N1N1',
          synchronize: true,
          index: 0,
          entropy: {
            type: 'mnemonic',
            id: '01K2FF18CTTXJYD34R78X4N1N1',
            groupIndex: 0,
            derivationPath: "m/44'/501'/0'/0'",
          },
        },
        scopes: [
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
          'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
        ],
        metadata: {
          name: 'Solana Account 1',
          importTime: 1755013234384,
          keyring: {
            type: 'Snap Keyring',
          },
          snap: {
            id: 'npm:@metamask/solana-wallet-snap',
            name: 'Solana',
            enabled: true,
          },
          lastSelected: 1755717637857,
        },
      },
    },
  };
  return {
    ...swapsStore,
    // For initial state of dest asset picker
    swaps: {
      ...swaps,
      topAssets: [],
    },
    bridge: {
      toChainId: null,
      sortOrder: 'cost_ascending',
      ...bridgeSliceOverrides,
    },
    localeMessages: { currentLocale: 'es_419' },
    metamask: {
      ...DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE,
      ...swapsMetamask,
      ...mockNetworkState(
        { chainId: CHAIN_IDS.MAINNET },
        { chainId: CHAIN_IDS.LINEA_MAINNET },
      ),
      multichainNetworkConfigurationsByChainId:
        AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
      selectedMultichainNetworkChainId: 'eip155:1',
      isEvmSelected: true,
      completedOnboarding: true,
      gasFeeEstimates: {
        estimatedBaseFee: '0.00010456',
        medium: {
          suggestedMaxFeePerGas: '0.00018456',
          suggestedMaxPriorityFeePerGas: '0.0001',
        },
        high: {
          suggestedMaxFeePerGas: '0.00018456',
          suggestedMaxPriorityFeePerGas: '0.0001',
        },
      },
      currencyRates: {
        ETH: { conversionRate: 2524.25 },
        usd: { conversionRate: 1 },
      },
      marketData: {
        '0x1': {
          '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
            currency: 'usd',
            price: 2.3,
          },
        },
      },
      slides: [],
      accountTree: {
        wallets: {
          'entropy:01K2FF18CTTXJYD34R78X4N1N1': {
            type: 'entropy',
            id: 'entropy:01K2FF18CTTXJYD34R78X4N1N1',
            metadata: {
              name: 'Wallet 1',
              entropy: {
                id: '01K2FF18CTTXJYD34R78X4N1N1',
              },
            },
            groups: {
              'entropy:01K2FF18CTTXJYD34R78X4N1N1/0': {
                type: 'multichain-account',
                id: 'entropy:01K2FF18CTTXJYD34R78X4N1N1/0',
                metadata: {
                  name: 'Account 1',
                  pinned: false,
                  hidden: false,
                  entropy: {
                    groupIndex: 0,
                  },
                },
                accounts: [
                  'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                  '07c2cfec-36c9-46c4-8115-3836d3ac9047',
                  'bf13d52c-d6e8-40ea-9726-07d7149a3ca5',
                  'account-1',
                ],
              },
              'entropy:01K2FF18CTTXJYD34R78X4N1N1/1': {
                type: 'multichain-account',
                id: 'entropy:01K2FF18CTTXJYD34R78X4N1N1/1',
                metadata: {
                  name: 'Account 2',
                  pinned: false,
                  hidden: false,
                  entropy: {
                    groupIndex: 1,
                  },
                },
                accounts: ['15e69915-2a1a-4019-93b3-916e11fd432f'],
              },
            },
          },
        },
        selectedAccountGroup: 'entropy:01K2FF18CTTXJYD34R78X4N1N1/0',
      },
      ...tokenData,
      ...metamaskStateOverridesWithoutAccounts,
      internalAccounts,
      ...{
        ...getDefaultBridgeControllerState(),
        remoteFeatureFlags: {
          ...featureFlagOverrides,
          bridgeConfig: {
            minimumVersion: '0.0.0',
            support: false,
            refreshRate: 5000,
            maxRefreshCount: 5,
            ...featureFlagOverrides?.extensionConfig,
            ...featureFlagOverrides?.bridgeConfig,
            chains: {
              [formatChainIdToCaip('0x1')]: {
                isActiveSrc: true,
                isActiveDest: false,
              },
              ...Object.fromEntries(
                Object.entries(
                  featureFlagOverrides?.extensionConfig?.chains ??
                    featureFlagOverrides?.bridgeConfig?.chains ??
                    {},
                ).map(([chainId, config]) => [
                  formatChainIdToCaip(chainId),
                  config,
                ]),
              ),
            },
          },
        },
      },
      ...bridgeStateOverrides,
      ...bridgeStatusStateOverrides,
    },
    send: {
      swapsBlockedTokens: [],
    },
    ...stateOverrides,
    // TODO fix types
  } as unknown as BridgeAppState;
};
