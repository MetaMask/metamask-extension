import {
  getDefaultBridgeControllerState,
  formatChainIdToCaip,
  FeatureFlagResponse,
  BridgeControllerState,
} from '@metamask/bridge-controller';
import { DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE } from '@metamask/bridge-status-controller';
import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { zeroAddress } from 'ethereumjs-util';
import { KeyringTypes } from '@metamask/keyring-controller';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import { ETH_SCOPE_EOA } from '@metamask/keyring-utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import type { BridgeAppState } from '../../../ui/ducks/bridge/selectors';
import { createSwapsMockStore } from '../../jest/mock-store';
import { mockNetworkState } from '../../stub/networks';
import { ETH_EOA_METHODS } from '../../../shared/constants/eth-methods';
import { KeyringType } from '../../../shared/constants/keyring';
import { mockTokenData } from './mock-token-data';

export const MOCK_LEDGER_ACCOUNT = {
  id: 'bf588376-0492-4a35-b653-0f1304a6c5f1',
  address: '0xb3864b298f4fddbbbd2fa5cf1a2a2748932b3b82',
  options: {},
  methods: [
    'personal_sign',
    'eth_sign',
    'eth_signTransaction',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
  ],
  scopes: ['eip155:0'],
  type: 'eip155:eoa',
  metadata: {
    name: 'Ledger 1',
    importTime: 1759424950983,
    lastSelected: 1760729126814,
    keyring: {
      type: 'Ledger Hardware',
    },
  },
};

export const MOCK_SOLANA_ACCOUNT = {
  type: 'solana:data-account',
  id: 'bf13d52c-d6e8-40ea-9726-07d7149a3ca5',
  address: 'ABCDEu4xsyvDpnqL5DQMVrh8AXxZKJPKJw5QsM7KEF8J',
  options: {
    scope: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    derivationPath: "m/44'/501'/0'/0'",
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
      type: KeyringTypes.snap,
    },
    snap: {
      id: 'npm:@metamask/solana-wallet-snap',
      name: 'Solana',
      enabled: true,
    },
    lastSelected: 1755717637857,
  },
};

export const MOCK_EVM_ACCOUNT = {
  address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
  metadata: {
    name: 'Test Account',
    keyring: {
      type: 'HD Key Tree',
    },
  },
  options: {
    entropy: {
      type: 'mnemonic',
      id: '01K2FF18CTTXJYD34R78X4N1N1',
      groupIndex: 0,
    },
  },
  methods: ETH_EOA_METHODS,
  type: EthAccountType.Eoa,
  scopes: [ETH_SCOPE_EOA],
};

export const MOCK_EVM_ACCOUNT_2 = {
  address: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
  id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
  metadata: {
    name: 'Test Account 2',
    keyring: {
      type: 'HD Key Tree',
    },
  },
  options: {
    entropy: {
      type: 'mnemonic',
      id: '01K2FF18CTTXJYD34R78X4N1N1',
      groupIndex: 1,
    },
  },
  methods: ETH_EOA_METHODS,
  type: EthAccountType.Eoa,
  scopes: [EthScope.Eoa],
};

export const createBridgeMockStore = ({
  featureFlagOverrides = { bridgeConfig: {} },
  bridgeSliceOverrides = {},
  bridgeStateOverrides = {},
  bridgeStatusStateOverrides = {},
  metamaskStateOverrides = {},
  stateOverrides = {},
}: {
  featureFlagOverrides?: { bridgeConfig: Partial<FeatureFlagResponse> };
  bridgeStateOverrides?: Partial<BridgeControllerState>;
  // bridgeStatusStateOverrides?: Partial<BridgeStatusState>;
  // metamaskStateOverrides?: Partial<BridgeAppState['metamask']>;
  // TODO replace these with correct types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bridgeSliceOverrides?: Record<string, any>;
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
    accountTree: accountTreeOverrides,
    marketData,
    ...metamaskStateOverridesWithoutAccounts
  } = metamaskStateOverrides;
  // Checksum the addresses in the marketData object
  // Also add a price for the zero address if not provided
  const marketDataOverrides = Object.fromEntries(
    Object.entries(marketData ?? {}).map(([chainId, addressToData]) => {
      const dataForChain = Object.fromEntries(
        Object.entries(addressToData ?? {}).map(([address, data]) => {
          return [toChecksumHexAddress(address), data];
        }),
      );
      if (!dataForChain[zeroAddress()]) {
        dataForChain[zeroAddress()] = { price: 1 };
      }
      return [chainId, dataForChain];
    }),
  );

  const internalAccounts = {
    selectedAccount:
      internalAccountsOverrides?.selectedAccount ?? MOCK_EVM_ACCOUNT.id,
    accounts: {
      ...(internalAccountsOverrides?.accounts ?? {}),
      [MOCK_LEDGER_ACCOUNT.id]: MOCK_LEDGER_ACCOUNT,
      [MOCK_SOLANA_ACCOUNT.id]: MOCK_SOLANA_ACCOUNT,
      [MOCK_EVM_ACCOUNT.id]: MOCK_EVM_ACCOUNT,
      [MOCK_EVM_ACCOUNT_2.id]: MOCK_EVM_ACCOUNT_2,
    },
  };
  return {
    activeTab: {
      origin: 'https://github.com',
    },
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
      permissionHistory: {},
      subjectMetadata: {
        'https://github.com': {
          iconUrl: 'https://github.githubassets.com/favicons/favicon-dark.png',
          name: 'GitHub',
          subjectType: 'website',
          origin: 'https://github.com',
          extensionId: null,
        },
      },
      featureFlags: {},
      ...DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE,
      ...swapsMetamask,
      ...mockNetworkState(
        { chainId: CHAIN_IDS.MAINNET },
        { chainId: CHAIN_IDS.LINEA_MAINNET },
      ),
      enabledNetworkMap: {
        eip155: {
          '0x1': true,
          '0xe708': true,
        },
      },
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
          [toChecksumHexAddress('0x1f9840a85d5af5bf1d1762f925bdaddc4201f984')]:
            {
              currency: 'ETH',
              price: 2.3,
            },
        },
        ...marketDataOverrides,
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
                accounts: [MOCK_EVM_ACCOUNT.id, MOCK_SOLANA_ACCOUNT.id],
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
                accounts: [MOCK_EVM_ACCOUNT_2.id],
              },
            },
          },
          'keyring:Ledger Hardware': {
            type: 'keyring',
            id: 'keyring:Ledger Hardware',
            metadata: {
              name: 'Ledger',
              keyring: {
                type: 'Ledger Hardware',
              },
            },
            status: 'ready',
            groups: {
              'keyring:Ledger Hardware/0xb3864b298f4fddbbbd2fa5cf1a2a2748932b3b82':
                {
                  type: 'single-account',
                  id: 'keyring:Ledger Hardware/0xb3864b298f4fddbbbd2fa5cf1a2a2748932b3b82',
                  metadata: {
                    name: 'Ledger Account 1',
                    pinned: false,
                    hidden: false,
                  },
                  accounts: [MOCK_LEDGER_ACCOUNT.id],
                },
            },
          },
        },
        selectedAccountGroup:
          accountTreeOverrides?.selectedAccountGroup ??
          'entropy:01K2FF18CTTXJYD34R78X4N1N1/0',
      },
      ...tokenData,
      ...metamaskStateOverridesWithoutAccounts,
      internalAccounts,
      keyrings: [
        {
          type: KeyringType.hdKeyTree,
          accounts: [MOCK_EVM_ACCOUNT.address],
          metadata: {
            id: '01JKAF3DSGM3AB87EM9N0K41AJ',
            name: '',
          },
        },
        {
          type: KeyringType.snap,
          accounts: [MOCK_SOLANA_ACCOUNT.address],
          metadata: {
            id: '01K6GQ6SXDB9GKP6CAPSRV5AJF',
            name: '',
          },
        },
        {
          type: KeyringType.ledger,
          accounts: [MOCK_LEDGER_ACCOUNT.address],
          metadata: {
            id: '01JKAF3KP7VPAG0YXEDTDRB6ZV',
            name: '',
          },
        },

        {
          type: KeyringType.hdKeyTree,
          accounts: [MOCK_EVM_ACCOUNT_2.address],
          metadata: {
            id: '01JKAF3DSGM3AB87EM9N0KA1AJ',
            name: '',
          },
        },
      ],
      ...{
        ...getDefaultBridgeControllerState(),
        remoteFeatureFlags: {
          ...featureFlagOverrides,
          bridgeConfig: {
            minimumVersion: '0.0.0',
            support: false,
            refreshRate: 5000,
            maxRefreshCount: 5,
            ...featureFlagOverrides?.bridgeConfig,
            chains: {
              [formatChainIdToCaip('0x1')]: {
                isActiveSrc: true,
                isActiveDest: false,
              },
              ...Object.fromEntries(
                Object.entries(
                  featureFlagOverrides?.bridgeConfig?.chains ?? {},
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
    DNS: {
      resolutions: [],
    },
    ...stateOverrides,
    // TODO fix types
  } as unknown as BridgeAppState;
};
