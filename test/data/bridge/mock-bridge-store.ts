import {
  getDefaultBridgeControllerState,
  formatChainIdToCaip,
  FeatureFlagResponse,
  BridgeControllerState,
  getNativeAssetForChainId,
  ChainId,
} from '@metamask/bridge-controller';
import { DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE } from '@metamask/bridge-status-controller';
import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { zeroAddress } from 'ethereumjs-util';
import { type CaipChainId } from '@metamask/utils';
import { KeyringTypes } from '@metamask/keyring-controller';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import { ETH_SCOPE_EOA } from '@metamask/keyring-utils';
import type { SmartTransactionsNetworks } from '../../../shared/modules/selectors/feature-flags';
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

export const MOCK_BITCOIN_ACCOUNT = {
  type: 'bip122:p2wpkh',
  scopes: ['bip122:000000000019d6689c085ae165831e93'],
  id: '40b25442-ed7e-4b94-9f9f-ea8ff06d03b3',
  address: 'bc1q2pxsagdzfdn6k6umvf9gj3eme7a27p7acym9g2',
  options: {
    derivationPath: "m/44'/501'/0'/0'",
    synchronize: true,
    index: 0,
    exportable: false,
    entropy: {
      type: 'mnemonic',
      id: '01K2FF18CTTXJYD34R78X4N1N1',
      derivationPath: "m/44'/501'/0'/0'",
      groupIndex: 0,
    },
  },
  methods: [
    'signPsbt',
    'computeFee',
    'fillPsbt',
    'broadcastPsbt',
    'sendTransfer',
    'getUtxo',
    'listUtxos',
    'publicDescriptor',
    'signMessage',
  ],
  metadata: {
    name: 'Snap Account 9',
    importTime: 1763417984346,
    keyring: {
      type: 'Snap Keyring',
    },
    snap: {
      id: 'npm:@metamask/bitcoin-wallet-snap',
      name: 'Bitcoin',
      enabled: true,
    },
    lastSelected: 1764203245474,
  },
};

export const createBridgeMockStore = ({
  featureFlagOverrides = { bridgeConfig: {} },
  bridgeSliceOverrides = {},
  bridgeStateOverrides = {},
  bridgeStatusStateOverrides = {},
  metamaskStateOverrides = {},
  stateOverrides = {},
}: {
  featureFlagOverrides?: {
    bridgeConfig: Partial<FeatureFlagResponse> & {
      chainRanking?: { chainId: CaipChainId; name?: string }[];
    };
    smartTransactionsNetworks?: SmartTransactionsNetworks;
  };
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
      [MOCK_BITCOIN_ACCOUNT.id]: MOCK_BITCOIN_ACCOUNT,
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
        { chainId: CHAIN_IDS.OPTIMISM },
      ),
      enabledNetworkMap: {
        eip155: {
          '0x1': true,
          '0xe708': true,
          '0xa': true,
        },
        bip122: {
          'bip122:000000000019d6689c085ae165831e93': true,
          'bip122:000000000933ea01ad0ee984209779ba': false,
          'bip122:00000000da84f2bafbbc53dee25a72ae': false,
          'bip122:00000008819873e925422c1ff0f99f7c': false,
          'bip122:regtest': false,
        },
        solana: {
          'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z': false,
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
          'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1': false,
        },
        tron: {
          'tron:2494104990': false,
          'tron:3448148188': false,
          'tron:728126428': true,
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
      },
      marketData: {
        '0x1': {
          '0x0000000000000000000000000000000000000000': {
            currency: 'ETH',
            price: 0.9999852655257913,
          },
          [toChecksumHexAddress('0x1f9840a85d5af5bf1d1762f925bdaddc4201f984')]:
            {
              currency: 'ETH',
              price: 2.3,
            },
          [toChecksumHexAddress('0x514910771af9ca656af840dff83e8264ecf986ca')]:
            {
              currency: 'ETH',
              price: 1.2,
            },
          [toChecksumHexAddress('0xc00e94cb662c3520282e6f5717214004a7f26888')]:
            {
              currency: 'ETH',
              price: 1.2,
            },
        },
        '0xe708': {
          '0x0000000000000000000000000000000000000000': {
            currency: 'ETH',
            price: 0.9999852655257913,
          },
          [toChecksumHexAddress('0x1f9840a85d5af5bf1d1762f925bdaddc4201f984')]:
            {
              currency: 'ETH',
              price: 0.0023,
            },
          [toChecksumHexAddress('0x514910771af9ca656af840dff83e8264ecf986ca')]:
            {
              currency: 'ETH',
              price: 0.00012,
            },
          [toChecksumHexAddress('0xc00e94cb662c3520282e6f5717214004a7f26888')]:
            {
              currency: 'ETH',
              price: 1.2,
            },
        },
        '0xa': {
          '0x0000000000000000000000000000000000000000': {
            currency: 'ETH',
            price: 0.9999852655257913,
          },
          [toChecksumHexAddress('0x1f9840a85d5af5bf1d1762f925bdaddc4201f984')]:
            {
              currency: 'ETH',
              price: 0.0023,
            },
          [toChecksumHexAddress('0x514910771af9ca656af840dff83e8264ecf986ca')]:
            {
              currency: 'ETH',
              price: 0.00012,
            },
          [toChecksumHexAddress('0xc00e94cb662c3520282e6f5717214004a7f26888')]:
            {
              currency: 'ETH',
              price: 1.2,
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
                accounts: [
                  MOCK_EVM_ACCOUNT.id,
                  MOCK_SOLANA_ACCOUNT.id,
                  MOCK_BITCOIN_ACCOUNT.id,
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
      accountsAssets: {
        [MOCK_SOLANA_ACCOUNT.id]: [
          getNativeAssetForChainId(ChainId.SOLANA)?.assetId,
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        ],
        [MOCK_BITCOIN_ACCOUNT.id]: [
          getNativeAssetForChainId(ChainId.BTC)?.assetId,
        ],
      },
      assetsMetadata: {
        [getNativeAssetForChainId(ChainId.SOLANA)?.assetId]: {
          symbol: 'SOL',
          name: 'Solana',
          units: [{ decimals: 18, symbol: 'SOL', name: 'Solana' }],
        },
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
          {
            fungible: true,
            name: 'USDC',
            symbol: 'USDC',
            units: [
              {
                decimals: 6,
                name: 'USDC',
                symbol: 'USDC',
              },
            ],
          },
        [getNativeAssetForChainId(ChainId.BTC)?.assetId]: {
          symbol: 'BTC',
          name: 'Bitcoin',
          units: [{ decimals: 18, symbol: 'BTC', name: 'Bitcoin' }],
        },
      },
      balances: {
        [MOCK_SOLANA_ACCOUNT.id]: {
          [getNativeAssetForChainId(ChainId.SOLANA)?.assetId]: {
            amount: '1.530',
            unit: 'SOL',
          },
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
            {
              amount: '2.043238',
              unit: 'USDC',
            },
        },
        [MOCK_BITCOIN_ACCOUNT.id]: {
          [getNativeAssetForChainId(ChainId.BTC)?.assetId]: {
            amount: '.001',
            unit: 'BTC',
          },
        },
        ...(metamaskStateOverrides?.balances ?? {}),
      },
      conversionRates: {
        'bip122:000000000019d6689c085ae165831e93/slip44:0': {
          currency: 'swift:0/iso4217:USD',
          rate: '91238',
          conversionTime: 1764366649,
          expirationTime: 1764366709,
          marketData: {
            fungible: true,
            allTimeHigh: '126080',
            allTimeLow: '67.81',
            circulatingSupply: '19954975',
            marketCap: '1820846090334',
            totalVolume: '63233490221',
            pricePercentChange: {
              PT1H: 0.14674079482116037,
              P1D: -0.3266459857373634,
              P7D: 8.041646444018049,
              P14D: -4.64281981432302,
              P30D: -17.6114540675602,
              P200D: -10.394045992482502,
              P1Y: -4.028695322822178,
            },
          },
        },
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
          currency: 'swift:0/iso4217:USD',
          rate: '137.81',
          conversionTime: 1764366649784,
          expirationTime: 1764366709784,
          marketData: {
            fungible: true,
            marketCap: '77113923709',
            totalVolume: '5381048463',
            circulatingSupply: '559406666.005579',
            allTimeHigh: '293.31',
            allTimeLow: '0.500801',
            pricePercentChange: {
              PT1H: 0.1717946873740562,
              P1D: -3.1063493477666846,
              P7D: 8.322669902409686,
              P14D: -3.558605681511118,
              P30D: -28.69964485595587,
              P200D: -19.402511945384653,
              P1Y: -41.43017825170346,
            },
          },
        },
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
          {
            currency: 'swift:0/iso4217:USD',
            rate: '0.99981',
            conversionTime: 1764366649785,
            expirationTime: 1764366709785,
            marketData: {
              fungible: true,
              marketCap: '76526787463',
              totalVolume: '4518890812',
              circulatingSupply: '76541337540.76373',
              allTimeHigh: '1.17',
              allTimeLow: '0.877647',
              pricePercentChange: {
                PT1H: -0.0005365195173000486,
                P1D: 0.006027885139514154,
                P7D: 0.009664272754267057,
                P14D: 0.0008506382418247201,
                P30D: -0.0032161834673792035,
                P200D: -0.009267417253211431,
                P1Y: 0.0033493407010139233,
              },
            },
          },
      },
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
          type: KeyringType.snap,
          accounts: [MOCK_BITCOIN_ACCOUNT.address],
          metadata: {
            id: '01K6GQ6SXDB9GKP6CAPSRV5AJG',
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
      smartTransactionsState: {
        liveness: false,
        livenessByChainId: { '0x1': true },
      },
      ...{
        ...getDefaultBridgeControllerState(),
        remoteFeatureFlags: {
          ...featureFlagOverrides,
          smartTransactionsNetworks: {
            '0x1': { extensionActive: true },
            ...featureFlagOverrides?.smartTransactionsNetworks,
          },
          bridgeConfig: {
            minimumVersion: '0.0.0',
            support: false,
            refreshRate: 5000,
            maxRefreshCount: 5,
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
                    // USDC instead of MUSD
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
            ...featureFlagOverrides?.bridgeConfig,
            chainRanking: [
              { chainId: formatChainIdToCaip('0x1') },
              ...Object.keys(
                featureFlagOverrides?.bridgeConfig?.chains ?? [],
              ).map((chainId) => ({
                chainId: formatChainIdToCaip(chainId),
              })),
            ],
            chains: {
              [formatChainIdToCaip('0x1')]: {
                isActiveSrc: true,
                isActiveDest: true,
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
            ...featureFlagOverrides?.bridgeConfig,
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
