import { draftTransactionInitialState } from '../ui/ducks/send';
import { KeyringType } from '../shared/constants/keyring';
import { NetworkType } from '@metamask/controller-utils';
import { NetworkStatus } from '@metamask/network-controller';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import { CHAIN_IDS } from '../shared/constants/network';
import { copyable, divider, heading, panel, text } from '@metamask/snaps-sdk';

const state = {
  invalidCustomNetwork: {
    state: 'CLOSED',
    networkName: '',
  },
  unconnectedAccount: {
    state: 'CLOSED',
  },
  activeTab: {
    id: 113,
    title: 'E2E Test Dapp',
    origin: 'https://metamask.github.io',
    protocol: 'https:',
    url: 'https://metamask.github.io/test-dapp/',
  },
  metamask: {
    announcements: {
      22: {
        id: 22,
        date: null,
      },
    },
    orderedNetworkList: [],
    pinnedAccountList: [],
    hiddenAccountList: [],
    tokenList: {
      '0x514910771af9ca656af840dff83e8264ecf986ca': {
        address: '0x514910771af9ca656af840dff83e8264ecf986ca',
        symbol: 'LINK',
        decimals: 18,
        name: 'ChainLink Token',
        iconUrl: 'https://crypto.com/price/coin-data/icon/LINK/color_icon.png',
        aggregators: [
          'Aave',
          'Bancor',
          'CMC',
          'Crypto.com',
          'CoinGecko',
          '1inch',
          'Paraswap',
          'PMM',
          'Zapper',
          'Zerion',
          '0x',
        ],
        occurrences: 12,
        unlisted: false,
      },
      '0xc00e94cb662c3520282e6f5717214004a7f26888': {
        address: '0xc00e94cb662c3520282e6f5717214004a7f26888',
        symbol: 'COMP',
        decimals: 18,
        name: 'Compound',
        iconUrl: 'https://crypto.com/price/coin-data/icon/COMP/color_icon.png',
        aggregators: [
          'Bancor',
          'CMC',
          'Crypto.com',
          'CoinGecko',
          '1inch',
          'Paraswap',
          'PMM',
          'Zapper',
          'Zerion',
          '0x',
        ],
        occurrences: 12,
        unlisted: false,
      },
      '0xfffffffff15abf397da76f1dcc1a1604f45126db': {
        address: '0xfffffffff15abf397da76f1dcc1a1604f45126db',
        symbol: 'FSW',
        decimals: 18,
        name: 'Falconswap',
        iconUrl:
          'https://assets.coingecko.com/coins/images/12256/thumb/falconswap.png?1598534184',
        aggregators: ['CoinGecko', '1inch', 'Lifi'],
        occurrences: 3,
        unlisted: false,
      },
      '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f': {
        address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
        symbol: 'SNX',
        decimals: 18,
        name: 'Synthetix Network Token',
        iconUrl: 'https://assets.coingecko.com/coins/images/3406/large/SNX.png',
        aggregators: [
          'Aave',
          'Bancor',
          'CMC',
          'Crypto.com',
          'CoinGecko',
          '1inch',
          'Paraswap',
          'PMM',
          'Synthetix',
          'Zapper',
          'Zerion',
          '0x',
        ],
        occurrences: 12,
        unlisted: false,
      },
      '0x6b175474e89094c44da98b954eedeac495271d0f': {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        symbol: 'ETH',
        decimals: 18,
        image: './images/eth_logo.svg',
        unlisted: false,
      },
      '0xB8c77482e45F1F44dE1745F52C74426C631bDD52': {
        address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
        symbol: '0X',
        decimals: 18,
        image: '0x.svg',
        unlisted: false,
      },
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
        address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        symbol: 'AST',
        decimals: 18,
        image: 'ast.png',
        unlisted: false,
      },
      '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2': {
        address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
        symbol: 'BAT',
        decimals: 18,
        image: 'BAT_icon.svg',
        unlisted: false,
      },
      '0xe83cccfabd4ed148903bf36d4283ee7c8b3494d1': {
        address: '0xe83cccfabd4ed148903bf36d4283ee7c8b3494d1',
        symbol: 'CVL',
        decimals: 18,
        image: 'CVL_token.svg',
        unlisted: false,
      },
      '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e': {
        address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
        symbol: 'GLA',
        decimals: 18,
        image: 'gladius.svg',
        unlisted: false,
      },
      '0x467Bccd9d29f223BcE8043b84E8C8B282827790F': {
        address: '0x467Bccd9d29f223BcE8043b84E8C8B282827790F',
        symbol: 'GNO',
        decimals: 18,
        image: 'gnosis.svg',
        unlisted: false,
      },
      '0xff20817765cb7f73d4bde2e66e067e58d11095c2': {
        address: '0xff20817765cb7f73d4bde2e66e067e58d11095c2',
        symbol: 'OMG',
        decimals: 18,
        image: 'omg.jpg',
        unlisted: false,
      },
      '0x8e870d67f660d95d5be530380d0ec0bd388289e1': {
        address: '0x8e870d67f660d95d5be530380d0ec0bd388289e1',
        symbol: 'WED',
        decimals: 18,
        image: 'wed.png',
        unlisted: false,
      },
    },
    networkDetails: {
      EIPS: {
        1559: true,
      },
    },
    selectedNetworkClientId: NetworkType.mainnet,
    networksMetadata: {
      [NetworkType.mainnet]: {
        EIPS: {
          1559: true,
        },
        status: NetworkStatus.Available,
      },
    },
    gasFeeEstimates: '0x5208',
    swapsState: {
      quotes: {},
      fetchParams: null,
      tokens: null,
      tradeTxId: null,
      approveTxId: null,
      quotesLastFetched: null,
      customMaxGas: '',
      customGasPrice: null,
      selectedAggId: null,
      customApproveTxData: '',
      errorKey: '',
      topAggId: null,
      routeState: '',
      swapsFeatureIsLive: false,
      swapsQuoteRefreshTime: 60000,
    },
    snapStates: {},
    snaps: {
      'local:http://localhost:8080/': {
        enabled: true,
        id: 'local:http://localhost:8080/',
        initialPermissions: {
          snap_dialog: {},
        },
        manifest: {
          description: 'An example MetaMask Snap.',
          initialPermissions: {
            snap_dialog: {},
          },
          manifestVersion: '0.1',
          proposedName: 'MetaMask Example Snap',
          repository: {
            type: 'git',
            url: 'https://github.com/MetaMask/snaps-skunkworks.git',
          },
          source: {
            location: {
              npm: {
                filePath: 'dist/bundle.js',
                iconPath: 'images/icon.svg',
                packageName: '@metamask/example-snap',
                registry: 'https://registry.npmjs.org/',
              },
            },
            shasum: '3lEt0yUu080DwV78neROaAAIQWXukSkMnP4OBhOhBnE=',
          },
          version: '0.6.0',
        },
        sourceCode: '(...)',
        status: 'stopped',
        svgIcon: '<svg>...</svg>',
        version: '0.6.0',
      },
      'npm:@metamask/test-snap-bip44': {
        id: 'npm:@metamask/test-snap-bip44',
        origin: 'npm:@metamask/test-snap-bip44',
        version: '5.1.2',
        iconUrl: null,
        initialPermissions: {
          'endowment:ethereum-provider': {},
        },
        manifest: {
          description: 'An example Snap that signs messages using BLS.',
          proposedName: 'BIP-44 Test Snap',
          repository: {
            type: 'git',
            url: 'https://github.com/MetaMask/test-snaps.git',
          },
          source: {
            location: {
              npm: {
                filePath: 'dist/bundle.js',
                packageName: '@metamask/test-snap-bip44',
                registry: 'https://registry.npmjs.org',
              },
            },
            shasum: 'L1k+dT9Q+y3KfIqzaH09MpDZVPS9ZowEh9w01ZMTWMU=',
          },
          version: '5.1.2',
        },
        versionHistory: [
          {
            date: 1680686075921,
            origin: 'https://metamask.github.io',
            version: '5.1.2',
          },
        ],
      },
    },
    interfaces: {
      'test-interface': {
        content: panel([
          heading('Foo bar'),
          text('Description'),
          divider(),
          text('More text'),
          copyable('Text you can copy'),
        ]),
        state: {},
        snapId: 'local:http://localhost:8080/',
      },
      'error-interface': {
        content: 'foo',
        state: {},
        snapId: 'local:http://localhost:8080/',
      },
    },
    accountArray: [
      {
        name: 'This is a Really Long Account Name',
        address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
        index: 0,
        balance: '0x176e5b6f173ebe66',
      },
      {
        name: 'Account 2',
        address: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
        index: 1,
        balance: '0x2d3142f5000',
      },
    ],
    connectedAccounts: ['0x64a845a5b02460acf8a3d84503b0d68d028b4bb4'],
    isInitialized: true,
    isUnlocked: true,
    isAccountMenuOpen: false,
    rpcUrl: 'https://rawtestrpc.metamask.io/',
    internalAccounts: {
      accounts: {
        'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
          address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
          id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          metadata: {
            name: 'This is a Really Long Account Name',
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
          methods: [...Object.values(EthMethod)],
          type: EthAccountType.Eoa,
        },
        '07c2cfec-36c9-46c4-8115-3836d3ac9047': {
          address: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
          id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
          metadata: {
            name: 'Account 2',
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
          methods: [...Object.values(EthMethod)],
          type: EthAccountType.Eoa,
        },
        '15e69915-2a1a-4019-93b3-916e11fd432f': {
          address: '0x9d0ba4ddac06032527b140912ec808ab9451b788',
          id: '15e69915-2a1a-4019-93b3-916e11fd432f',
          metadata: {
            name: 'Account 3',
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
          methods: [...Object.values(EthMethod)],
          type: EthAccountType.Eoa,
        },
        '784225f4-d30b-4e77-a900-c8bbce735b88': {
          address: '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
          id: '784225f4-d30b-4e77-a900-c8bbce735b88',
          metadata: {
            name: 'Account 4',
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
          methods: [...Object.values(EthMethod)],
          type: EthAccountType.Eoa,
        },
        'b990b846-b384-4508-93d9-587461f1123e': {
          address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          id: 'b990b846-b384-4508-93d9-587461f1123e',
          metadata: {
            name: 'Test Account 1',
            keyring: {
              type: 'Test Keyring',
            },
          },
          options: {},
          methods: [...Object.values(EthMethod)],
          type: EthAccountType.Eoa,
        },
      },
      selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    },
    identities: {
      '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4': {
        name: 'This is a Really Long Account Name',
        address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
      },
      '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e': {
        name: 'Account 2',
        address: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
      },
      '0x9d0ba4ddac06032527b140912ec808ab9451b788': {
        name: 'Account 3',
        address: '0x9d0ba4ddac06032527b140912ec808ab9451b788',
      },
    },
    transactions: [
      {
        id: 3111025347726181,
        time: 1620710815484,
        status: 'unapproved',
        msgParams: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
        chainId: '0x5',
        loadingDefaults: false,
        txParams: {
          from: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
          to: '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
          value: '0x0',
          data: '0xa9059cbb000000000000000000000000b19ac54efa18cc3a14a5b821bfec73d284bf0c5e0000000000000000000000000000000000000000000000003782dace9d900000',
          gas: '0xcb28',
          gasPrice: '0x77359400',
        },
        type: 'standard',
        origin: 'metamask',
        transactionCategory: 'transfer',
        history: [
          {
            id: 7786962153682822,
            time: 1620710815484,
            status: 'unapproved',
            chainId: '0x5',
            loadingDefaults: true,
            txParams: {
              from: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
              to: '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
              value: '0x0',
              data: '0xa9059cbb000000000000000000000000b19ac54efa18cc3a14a5b821bfec73d284bf0c5e0000000000000000000000000000000000000000000000003782dace9d900000',
              gas: '0xcb28',
              gasPrice: '0x77359400',
            },
            type: 'standard',
            origin: 'metamask',
            transactionCategory: 'transfer',
          },
          [
            {
              op: 'replace',
              path: '/loadingDefaults',
              value: false,
              note: 'Added new unapproved transaction.',
              timestamp: 1620710815497,
            },
          ],
        ],
      },
    ],
    addressBook: {
      undefined: {
        0: {
          address: '0x39a4e4Af7cCB654dB9500F258c64781c8FbD39F0',
          name: '',
          isEns: false,
        },
      },
    },
    addresses: [
      {
        address: '0x39a4e4Af7cCB654dB9500F258c64781c8FbD39F0',
        name: 'DAI',
        isEns: false,
      },
      {
        address: '1x39a4e4Af7cCB654dB9500F258c64781c8FbD39F0',
        name: 'ETH',
        isEns: true,
      },
    ],
    contractExchangeRates: {
      '0xaD6D458402F60fD3Bd25163575031ACDce07538D': 0,
    },
    tokens: [
      {
        address: '0xaD6D458402F60fD3Bd25163575031ACDce07538A',
        symbol: 'DAA',
        decimals: 18,
      },
      {
        address: '0xaD6D458402F60fD3Bd25163575031ACDce07538U',
        symbol: 'DAU',
        decimals: 18,
      },
    ],
    allDetectedTokens: {
      '0xaa36a7': {
        '0x9d0ba4ddac06032527b140912ec808ab9451b788': [
          {
            address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
            decimals: 18,
            symbol: 'LINK',
            image:
              'https://crypto.com/price/coin-data/icon/LINK/color_icon.png',
            aggregators: [
              'coinGecko',
              'oneInch',
              'paraswap',
              'zapper',
              'zerion',
            ],
          },
          {
            address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
            decimals: 18,
            symbol: 'COMP',
            image:
              'https://crypto.com/price/coin-data/icon/COMP/color_icon.png',
            aggregators: [
              'bancor',
              'cmc',
              'cryptocom',
              'coinGecko',
              'oneInch',
              'paraswap',
              'pmm',
              'zapper',
              'zerion',
              'zeroEx',
            ],
          },
          {
            address: '0xfffffffFf15AbF397dA76f1dcc1A1604F45126DB',
            decimals: 18,
            symbol: 'FSW',
            image:
              'https://assets.coingecko.com/coins/images/12256/thumb/falconswap.png?1598534184',
            aggregators: [
              'aave',
              'cmc',
              'coinGecko',
              'oneInch',
              'paraswap',
              'zapper',
              'zerion',
            ],
          },
        ],
        '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4': [
          {
            address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
            decimals: 18,
            symbol: 'LINK',
            image:
              'https://crypto.com/price/coin-data/icon/LINK/color_icon.png',
            aggregators: [
              'coinGecko',
              'oneInch',
              'paraswap',
              'zapper',
              'zerion',
            ],
          },
          {
            address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
            decimals: 18,
            symbol: 'COMP',
            image:
              'https://crypto.com/price/coin-data/icon/COMP/color_icon.png',
            aggregators: [
              'bancor',
              'cmc',
              'cryptocom',
              'coinGecko',
              'oneInch',
              'paraswap',
              'pmm',
              'zapper',
              'zerion',
              'zeroEx',
            ],
          },
          {
            address: '0xfffffffFf15AbF397dA76f1dcc1A1604F45126DB',
            decimals: 18,
            symbol: 'FSW',
            image:
              'https://assets.coingecko.com/coins/images/12256/thumb/falconswap.png?1598534184',
            aggregators: [
              'aave',
              'cmc',
              'coinGecko',
              'oneInch',
              'paraswap',
              'zapper',
              'zerion',
            ],
          },
        ],
      },
    },
    detectedTokens: [
      {
        address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
        decimals: 18,
        symbol: 'LINK',
        image: 'https://crypto.com/price/coin-data/icon/LINK/color_icon.png',
        aggregators: ['coinGecko', 'oneInch', 'paraswap', 'zapper', 'zerion'],
      },
      {
        address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
        decimals: 18,
        symbol: 'COMP',
        image: 'https://crypto.com/price/coin-data/icon/COMP/color_icon.png',
        aggregators: [
          'bancor',
          'cmc',
          'cryptocom',
          'coinGecko',
          'oneInch',
          'paraswap',
          'pmm',
          'zapper',
          'zerion',
          'zeroEx',
        ],
      },
      {
        address: '0xfffffffFf15AbF397dA76f1dcc1A1604F45126DB',
        decimals: 18,
        symbol: 'FSW',
        image:
          'https://assets.coingecko.com/coins/images/12256/thumb/falconswap.png?1598534184',
        aggregators: [
          'aave',
          'cmc',
          'coinGecko',
          'oneInch',
          'paraswap',
          'zapper',
          'zerion',
        ],
      },
    ],
    pendingTokens: {},
    customNonceValue: '',
    send: {
      gasLimit: '0xcb28',
      gasPrice: null,
      gasTotal: null,
      tokenBalance: '8.7a73149c048545a3fe58',
      from: '',
      to: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
      amount: '3782dace9d900000',
      memo: '',
      errors: {},
      maxModeOn: false,
      editingTransactionId: null,
      toNickname: 'Account 2',
      domainResolution: null,
      domainResolutionError: '',
      token: {
        address: '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
        symbol: 'DAI',
        decimals: 18,
      },
    },
    useBlockie: false,
    featureFlags: {},
    welcomeScreenSeen: false,
    currentLocale: 'en',
    preferences: {
      useNativeCurrencyAsPrimaryCurrency: true,
    },
    incomingTransactionsPreferences: {
      [CHAIN_IDS.MAINNET]: true,
      [CHAIN_IDS.GOERLI]: false,
      [CHAIN_IDS.OPTIMISM_TESTNET]: false,
      [CHAIN_IDS.AVALANCHE_TESTNET]: true,
    },
    firstTimeFlowType: 'create',
    completedOnboarding: true,
    knownMethodData: {
      '0x60806040': {
        name: 'Approve Tokens',
      },
      '0x095ea7b3': {
        name: 'Approve Tokens',
      },
    },
    participateInMetaMetrics: true,
    nextNonce: 71,
    connectedStatusPopoverHasBeenShown: true,
    swapsWelcomeMessageHasBeenShown: true,
    defaultHomeActiveTabName: 'Tokens',
    providerConfig: {
      type: 'sepolia',
      ticker: 'ETH',
      nickname: 'Sepolia',
      rpcUrl: '',
      chainId: '0xaa36a7',
    },
    network: '5',
    accounts: {
      '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4': {
        address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
        balance: '0x176e5b6f173ebe66',
      },
      '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e': {
        address: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
        balance: '0x2d3142f5000',
      },
      '0x9d0ba4ddac06032527b140912ec808ab9451b788': {
        address: '0x9d0ba4ddac06032527b140912ec808ab9451b788',
        balance: '0x15f6f0b9d4f8d000',
      },
    },
    accountsByChainId: {
      '0x1': {
        '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4': { balance: '0x0' },
        '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e': {
          balance: '0xcaf5317161f400',
        },
        '0x9d0ba4ddac06032527b140912ec808ab9451b788': { balance: '0x0' },
      },
      '0x5': {
        '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4': {
          address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
          balance: '0x176e5b6f173ebe66',
        },
        '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e': {
          address: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
          balance: '0x2d3142f5000',
        },
        '0x9d0ba4ddac06032527b140912ec808ab9451b788': {
          address: '0x9d0ba4ddac06032527b140912ec808ab9451b788',
          balance: '0x15f6f0b9d4f8d000',
        },
      },
    },
    currentBlockGasLimit: '0x793af4',
    currentBlockGasLimitByChainId: {
      '0x5': '0x793af4',
    },
    transactions: [
      {
        chainId: '0x38',
        dappSuggestedGasFees: null,
        firstRetryBlockNumber: '0x9c2686',
        hash: '0xf45e7a751adfc0fbadccc972816baf33eb34543e52ace51f0f8d0d7f357afdc6',
        history: [
          {
            chainId: '0x38',
            dappSuggestedGasFees: null,
            id: 2360388496987298,
            loadingDefaults: true,
            origin: 'metamask',
            status: 'unapproved',
            time: 1629582710520,
            txParams: {
              data: '0xa9059cbb0000000000000000000000004ef2d5a1d056e7c9e8bcdbf2bd9ac0df749a1c2900000000000000000000000000000000000000000000000029a2241af62c0000',
              from: '0x17f62b1b2407c41c43e14da0699d6b4b0a521548',
              gas: '0x2eb27',
              gasPrice: '0x12a05f200',
              to: '0x2e8c05582176fa93b4590382e8290c73deb82176',
              type: '0x0',
              value: '0x0',
            },
            type: 'transfer',
          },
          [
            {
              note: 'Added new unapproved transaction.',
              op: 'replace',
              path: '/loadingDefaults',
              timestamp: 1629582710530,
              value: false,
            },
          ],
          [
            {
              note: 'txStateManager: setting status to approved',
              op: 'replace',
              path: '/status',
              timestamp: 1629582711218,
              value: 'approved',
            },
          ],
          [
            {
              note: 'transactions#approveTransaction',
              op: 'add',
              path: '/txParams/nonce',
              timestamp: 1629582711220,
              value: '0x15b',
            },
          ],
          [
            {
              note: 'transactions#signTransaction: add r, s, v values',
              op: 'add',
              path: '/r',
              timestamp: 1629582711236,
              value:
                '0x90a4dfb0646eef9815454d0ab543b5844acb8772101084565155c93ecce8ed69',
            },
            {
              op: 'add',
              path: '/s',
              value:
                '0x7fd317c727025490f282c7990b8518a7dab7521b1ada1cb639f887966bc078df',
            },
            {
              op: 'add',
              path: '/v',
              value: '0x93',
            },
          ],
          [
            {
              note: 'txStateManager: setting status to signed',
              op: 'replace',
              path: '/status',
              timestamp: 1629582711236,
              value: 'signed',
            },
          ],
          [
            {
              note: 'transactions#publishTransaction',
              op: 'add',
              path: '/rawTx',
              timestamp: 1629582711237,
              value:
                '0xf8ad82015b85012a05f2008302eb27942e8c05582176fa93b4590382e8290c73deb8217680b844a9059cbb0000000000000000000000004ef2d5a1d056e7c9e8bcdbf2bd9ac0df749a1c2900000000000000000000000000000000000000000000000029a2241af62c00008193a090a4dfb0646eef9815454d0ab543b5844acb8772101084565155c93ecce8ed69a07fd317c727025490f282c7990b8518a7dab7521b1ada1cb639f887966bc078df',
            },
          ],
          [
            {
              note: 'transactions#setTxHash',
              op: 'add',
              path: '/hash',
              timestamp: 1629582711336,
              value:
                '0xf45e7a751adfc0fbadccc972816baf33eb34543e52ace51f0f8d0d7f357afdc6',
            },
          ],
          [
            {
              note: 'txStateManager - add submitted time stamp',
              op: 'add',
              path: '/submittedTime',
              timestamp: 1629582711337,
              value: 1629582711337,
            },
          ],
          [
            {
              note: 'txStateManager: setting status to submitted',
              op: 'replace',
              path: '/status',
              timestamp: 1629582711338,
              value: 'submitted',
            },
          ],
          [
            {
              note: 'transactions/pending-tx-tracker#event: tx:block-update',
              op: 'add',
              path: '/firstRetryBlockNumber',
              timestamp: 1629582711878,
              value: '0x9c2686',
            },
          ],
          [
            {
              note: 'transactions/pending-tx-tracker#event: tx:block-update',
              op: 'add',
              path: '/firstRetryBlockNumber',
              timestamp: 1629582711878,
              value: '0x9c2686',
            },
          ],
          [
            {
              note: 'txStateManager: setting status to confirmed',
              op: 'replace',
              path: '/status',
              timestamp: 1629582721178,
              value: 'confirmed',
            },
          ],
          [
            {
              note: 'txStateManager: setting status to confirmed',
              op: 'replace',
              path: '/status',
              timestamp: 1629582721178,
              value: 'confirmed',
            },
            {
              op: 'add',
              path: '/txReceipt',
              value: {
                blockHash:
                  '0x30bf5dfa12e460a5d121267c00ba3047a14ba286e0c4fe75fa979010f527cba0',
                blockNumber: '9c2688',
                contractAddress: null,
                cumulativeGasUsed: '19a4942',
                from: '0x17f62b1b2407c41c43e14da0699d6b4b0a521548',
                gasUsed: '1f21a',
                logs: [
                  {
                    address: '0x2e8c05582176fa93b4590382e8290c73deb82176',
                    blockHash:
                      '0x30bf5dfa12e460a5d121267c00ba3047a14ba286e0c4fe75fa979010f527cba0',
                    blockNumber: '9c2688',
                    data: '0x00000000000000000000000000000000000000000000000028426c213d688000',
                    logIndex: '245',
                    removed: false,
                    topics: [
                      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                      '0x00000000000000000000000017f62b1b2407c41c43e14da0699d6b4b0a521548',
                      '0x0000000000000000000000004ef2d5a1d056e7c9e8bcdbf2bd9ac0df749a1c29',
                    ],
                    transactionHash:
                      '0xf45e7a751adfc0fbadccc972816baf33eb34543e52ace51f0f8d0d7f357afdc6',
                    transactionIndex: 'ae',
                  },
                  {
                    address: '0x2e8c05582176fa93b4590382e8290c73deb82176',
                    blockHash:
                      '0x30bf5dfa12e460a5d121267c00ba3047a14ba286e0c4fe75fa979010f527cba0',
                    blockNumber: '9c2688',
                    data: '0x000000000000000000000000000000000000000000000000006a94d74f430000',
                    logIndex: '246',
                    removed: false,
                    topics: [
                      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                      '0x00000000000000000000000017f62b1b2407c41c43e14da0699d6b4b0a521548',
                      '0x000000000000000000000000c825413863f677a2012bb8db3a5e4a18bbf29e56',
                    ],
                    transactionHash:
                      '0xf45e7a751adfc0fbadccc972816baf33eb34543e52ace51f0f8d0d7f357afdc6',
                    transactionIndex: 'ae',
                  },
                  {
                    address: '0x2e8c05582176fa93b4590382e8290c73deb82176',
                    blockHash:
                      '0x30bf5dfa12e460a5d121267c00ba3047a14ba286e0c4fe75fa979010f527cba0',
                    blockNumber: '9c2688',
                    data: '0x000000000000000000000000000000000000000000000000001ff973cafa8000',
                    logIndex: '247',
                    removed: false,
                    topics: [
                      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                      '0x00000000000000000000000017f62b1b2407c41c43e14da0699d6b4b0a521548',
                      '0x0000000000000000000000004ef2d5a1d056e7c9e8bcdbf2bd9ac0df749a1c29',
                    ],
                    transactionHash:
                      '0xf45e7a751adfc0fbadccc972816baf33eb34543e52ace51f0f8d0d7f357afdc6',
                    transactionIndex: 'ae',
                  },
                ],
                logsBloom:
                  '0x20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000100000000000020000000000000000000000000000000008000000000080000000000000000000000000000000000000000040000000000000000000000040000000000200000010000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000200000000000000000000800000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000',
                status: '0x1',
                to: '0x2e8c05582176fa93b4590382e8290c73deb82176',
                transactionHash:
                  '0xf45e7a751adfc0fbadccc972816baf33eb34543e52ace51f0f8d0d7f357afdc6',
                transactionIndex: 'ae',
                type: '0x0',
              },
            },
          ],
          [
            {
              note: 'transactions#confirmTransaction - add txReceipt',
              op: 'replace',
              path: '/txReceipt/transactionIndex',
              timestamp: 1629582721183,
              value: 'ae',
            },
            {
              op: 'replace',
              path: '/txReceipt/logs/2/logIndex',
              value: '247',
            },
            {
              op: 'replace',
              path: '/txReceipt/logs/2/transactionIndex',
              value: 'ae',
            },
            {
              op: 'replace',
              path: '/txReceipt/logs/2/blockNumber',
              value: '9c2688',
            },
            {
              op: 'replace',
              path: '/txReceipt/logs/1/logIndex',
              value: '246',
            },
            {
              op: 'replace',
              path: '/txReceipt/logs/1/transactionIndex',
              value: 'ae',
            },
            {
              op: 'replace',
              path: '/txReceipt/logs/1/blockNumber',
              value: '9c2688',
            },
            {
              op: 'replace',
              path: '/txReceipt/logs/0/logIndex',
              value: '245',
            },
            {
              op: 'replace',
              path: '/txReceipt/logs/0/transactionIndex',
              value: 'ae',
            },
            {
              op: 'replace',
              path: '/txReceipt/logs/0/blockNumber',
              value: '9c2688',
            },
            {
              op: 'replace',
              path: '/txReceipt/cumulativeGasUsed',
              value: '19a4942',
            },
            {
              op: 'replace',
              path: '/txReceipt/blockNumber',
              value: '9c2688',
            },
          ],
        ],
        id: 7900715443136469,
        loadingDefaults: false,
        origin: 'metamask',
        r: '0x90a4dfb0646eef9815454d0ab543b5844acb8772101084565155c93ecce8ed69',
        rawTx:
          '0xf8ad82015b85012a05f2008302eb27942e8c05582176fa93b4590382e8290c73deb8217680b844a9059cbb0000000000000000000000004ef2d5a1d056e7c9e8bcdbf2bd9ac0df749a1c2900000000000000000000000000000000000000000000000029a2241af62c00008193a090a4dfb0646eef9815454d0ab543b5844acb8772101084565155c93ecce8ed69a07fd317c727025490f282c7990b8518a7dab7521b1ada1cb639f887966bc078df',
        s: '0x7fd317c727025490f282c7990b8518a7dab7521b1ada1cb639f887966bc078df',
        status: 'confirmed',
        submittedTime: 1629582711337,
        time: 1629582710520,
        txParams: {
          data: '0xa9059cbb0000000000000000000000004ef2d5a1d056e7c9e8bcdbf2bd9ac0df749a1c2900000000000000000000000000000000000000000000000029a2241af62c0000',
          from: '0x17f62b1b2407c41c43e14da0699d6b4b0a521548',
          gas: '0x2eb27',
          gasPrice: '0x12a05f200',
          nonce: '0x15b',
          to: '0x2e8c05582176fa93b4590382e8290c73deb82176',
          type: '0x0',
          value: '0x0',
        },
        txReceipt: {
          blockHash:
            '0x30bf5dfa12e460a5d121267c00ba3047a14ba286e0c4fe75fa979010f527cba0',
          blockNumber: {
            length: 1,
            negative: 0,
            red: null,
            words: [10233480, null],
          },
          contractAddress: null,
          cumulativeGasUsed: {
            length: 1,
            negative: 0,
            red: null,
            words: [26888514, null],
          },
          from: '0x17f62b1b2407c41c43e14da0699d6b4b0a521548',
          gasUsed: '1f21a',
          logs: [
            {
              address: '0x2e8c05582176fa93b4590382e8290c73deb82176',
              blockHash:
                '0x30bf5dfa12e460a5d121267c00ba3047a14ba286e0c4fe75fa979010f527cba0',
              blockNumber: {
                length: 1,
                negative: 0,
                red: null,
                words: [10233480, null],
              },
              data: '0x00000000000000000000000000000000000000000000000028426c213d688000',
              logIndex: {
                length: 1,
                negative: 0,
                red: null,
                words: [581, null],
              },
              removed: false,
              topics: [
                '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                '0x00000000000000000000000017f62b1b2407c41c43e14da0699d6b4b0a521548',
                '0x0000000000000000000000004ef2d5a1d056e7c9e8bcdbf2bd9ac0df749a1c29',
              ],
              transactionHash:
                '0xf45e7a751adfc0fbadccc972816baf33eb34543e52ace51f0f8d0d7f357afdc6',
              transactionIndex: {
                length: 1,
                negative: 0,
                red: null,
                words: [174, null],
              },
            },
            {
              address: '0x2e8c05582176fa93b4590382e8290c73deb82176',
              blockHash:
                '0x30bf5dfa12e460a5d121267c00ba3047a14ba286e0c4fe75fa979010f527cba0',
              blockNumber: {
                length: 1,
                negative: 0,
                red: null,
                words: [10233480, null],
              },
              data: '0x000000000000000000000000000000000000000000000000006a94d74f430000',
              logIndex: {
                length: 1,
                negative: 0,
                red: null,
                words: [582, null],
              },
              removed: false,
              topics: [
                '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                '0x00000000000000000000000017f62b1b2407c41c43e14da0699d6b4b0a521548',
                '0x000000000000000000000000c825413863f677a2012bb8db3a5e4a18bbf29e56',
              ],
              transactionHash:
                '0xf45e7a751adfc0fbadccc972816baf33eb34543e52ace51f0f8d0d7f357afdc6',
              transactionIndex: {
                length: 1,
                negative: 0,
                red: null,
                words: [174, null],
              },
            },
            {
              address: '0x2e8c05582176fa93b4590382e8290c73deb82176',
              blockHash:
                '0x30bf5dfa12e460a5d121267c00ba3047a14ba286e0c4fe75fa979010f527cba0',
              blockNumber: {
                length: 1,
                negative: 0,
                red: null,
                words: [10233480, null],
              },
              data: '0x000000000000000000000000000000000000000000000000001ff973cafa8000',
              logIndex: {
                length: 1,
                negative: 0,
                red: null,
                words: [583, null],
              },
              removed: false,
              topics: [
                '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                '0x00000000000000000000000017f62b1b2407c41c43e14da0699d6b4b0a521548',
                '0x0000000000000000000000004ef2d5a1d056e7c9e8bcdbf2bd9ac0df749a1c29',
              ],
              transactionHash:
                '0xf45e7a751adfc0fbadccc972816baf33eb34543e52ace51f0f8d0d7f357afdc6',
              transactionIndex: {
                length: 1,
                negative: 0,
                red: null,
                words: [174, null],
              },
            },
          ],
          logsBloom:
            '0x20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000100000000000020000000000000000000000000000000008000000000080000000000000000000000000000000000000000040000000000000000000000040000000000200000010000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000200000000000000000000800000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000',
          status: '0x1',
          to: '0x2e8c05582176fa93b4590382e8290c73deb82176',
          transactionHash:
            '0xf45e7a751adfc0fbadccc972816baf33eb34543e52ace51f0f8d0d7f357afdc6',
          transactionIndex: {
            length: 1,
            negative: 0,
            red: null,
            words: [174, null],
          },
          type: '0x0',
        },
        type: 'transfer',
        v: '0x93',
      },
    ],
    unapprovedMsgs: {},
    unapprovedMsgCount: 0,
    unapprovedPersonalMsgs: {},
    unapprovedPersonalMsgCount: 0,
    unapprovedDecryptMsgs: {},
    unapprovedDecryptMsgCount: 0,
    unapprovedEncryptionPublicKeyMsgs: {
      7786962153682822: {
        id: 7786962153682822,
        msgParams: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
        time: 1622687544054,
        status: 'unapproved',
        type: 'eth_getEncryptionPublicKey',
        origin: 'https://metamask.github.io',
      },
    },
    unapprovedEncryptionPublicKeyMsgCount: 0,
    unapprovedTypedMessages: {},
    unapprovedTypedMessagesCount: 0,
    keyrings: [
      {
        type: KeyringType.hdKeyTree,
        accounts: [
          '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
          '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
        ],
      },
      {
        type: KeyringType.ledger,
        accounts: ['0x9d0ba4ddac06032527b140912ec808ab9451b788'],
      },
    ],
    networkConfigurations: {
      'test-networkConfigurationId-1': {
        rpcUrl: 'https://testrpc.com',
        chainId: '0x1',
        nickname: 'mainnet',
        rpcPrefs: { blockExplorerUrl: 'https://etherscan.io' },
      },
      'test-networkConfigurationId-2': {
        rpcUrl: 'http://localhost:8545',
        chainId: '0x539',
        ticker: 'ETH',
        nickname: 'Localhost 8545',
        rpcPrefs: {},
      },
    },
    accountTokens: {
      '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4': {
        '0x1': [
          {
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            symbol: 'DAI',
            decimals: 18,
          },
          {
            address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
            symbol: 'BAT',
            decimals: 18,
          },
        ],
        '0x5': [
          {
            address: '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
            symbol: 'DAI',
            decimals: 18,
          },
        ],
      },
      '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e': {},
      '0x9d0ba4ddac06032527b140912ec808ab9451b788': {},
    },
    accountHiddenTokens: {
      '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4': {
        '0x5': [],
      },
    },
    assetImages: {
      '0xaD6D458402F60fD3Bd25163575031ACDce07538D': './sai.svg',
    },
    hiddenTokens: [],
    useNonceField: false,
    usePhishDetect: true,
    useTokenDetection: true,
    useCurrencyRateCheck: true,
    lostIdentities: {},
    forgottenPassword: false,
    ipfsGateway: 'dweb.link',
    migratedPrivacyMode: false,
    selectedAddress: '0x9d0ba4ddac06032527b140912ec808ab9451b788',
    metaMetricsId:
      '0xc2377d11fec1c3b7dd88c4854240ee5e3ed0d9f63b00456d98d80320337b827f',
    currentCurrency: 'usd',
    currencyRates: {
      ETH: {
        conversionDate: 1620710825.03,
        conversionRate: 3910.28,
        usdConversionRate: 3910.28,
      },
    },
    ticker: 'ETH',
    alertEnabledness: {
      unconnectedAccount: true,
      web3ShimUsage: true,
    },
    unconnectedAccountAlertShownOrigins: {},
    web3ShimUsageOrigins: {},
    seedPhraseBackedUp: null,
    onboardingTabs: {},
    incomingTransactions: {
      '0x2de9256a7c604586f7ecfd87ae9509851e217f588f9f85feed793c54ed2ce0aa': {
        blockNumber: '8888976',
        id: 4678200543090532,
        chainId: '0x1',
        status: 'confirmed',
        time: 1573114896000,
        txParams: {
          from: '0x3f1b52850109023775d238c7ed5d5e7161041fd1',
          gas: '0x5208',
          gasPrice: '0x124101100',
          nonce: '0x35',
          to: '0x045c619e4d29bba3b92769508831b681b83d6a96',
          value: '0xbca9bce4d98ca3',
        },
        hash: '0x2de9256a7c604586f7ecfd87ae9509851e217f588f9f85feed793c54ed2ce0aa',
        transactionCategory: 'incoming',
      },
      '0x320a1fd769373578f78570e5d8f56e89bc7bce9657bb5f4c12d8fe790d471bfd': {
        blockNumber: '9453174',
        id: 4678200543090535,
        chainId: '0x1',
        status: 'confirmed',
        time: 1581312411000,
        txParams: {
          from: '0xa17bd07d6d38cb9e37b29f7659a4b1047701e969',
          gas: '0xc350',
          gasPrice: '0x1a13b8600',
          nonce: '0x0',
          to: '0x045c619e4d29bba3b92769508831b681b83d6a96',
          value: '0xcdb08ab4254000',
        },
        hash: '0x320a1fd769373578f78570e5d8f56e89bc7bce9657bb5f4c12d8fe790d471bfd',
        transactionCategory: 'incoming',
      },
      '0x8add6c1ea089a8de9b15fa2056b1875360f17916755c88ace9e5092b7a4b1239': {
        blockNumber: '10892417',
        id: 4678200543090542,
        chainId: '0x1',
        status: 'confirmed',
        time: 1600515224000,
        txParams: {
          from: '0x0681d8db095565fe8a346fa0277bffde9c0edbbf',
          gas: '0x5208',
          gasPrice: '0x1d1a94a200',
          nonce: '0x2bb8a5',
          to: '0x045c619e4d29bba3b92769508831b681b83d6a96',
          value: '0xe6ed27d6668000',
        },
        hash: '0x8add6c1ea089a8de9b15fa2056b1875360f17916755c88ace9e5092b7a4b1239',
        transactionCategory: 'incoming',
      },
      '0x50be62ab1cabd03ff104c602c11fdef7a50f3d73c55006d5583ba97950ab1144': {
        blockNumber: '10902987',
        id: 4678200543090545,
        chainId: '0x1',
        status: 'confirmed',
        time: 1600654021000,
        txParams: {
          from: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
          gas: '0x5208',
          gasPrice: '0x147d357000',
          nonce: '0xf',
          to: '0x045c619e4d29bba3b92769508831b681b83d6a96',
          value: '0x63eb89da4ed00000',
        },
        hash: '0x50be62ab1cabd03ff104c602c11fdef7a50f3d73c55006d5583ba97950ab1144',
        transactionCategory: 'incoming',
      },
    },
    incomingTxLastFetchedBlocksByNetwork: {
      goerli: null,
      sepolia: null,
      mainnet: 10902989,
    },
    subjects: {
      'https://app.uniswap.org': {
        permissions: {
          eth_accounts: {
            invoker: 'https://app.uniswap.org',
            parentCapability: 'eth_accounts',
            id: 'a7342e4b-beae-4525-a36c-c0635fd03359',
            date: 1620710693178,
            caveats: [
              {
                type: 'restrictReturnedAccounts',
                value: ['0x64a845a5b02460acf8a3d84503b0d68d028b4bb4'],
              },
            ],
          },
        },
      },
      'local:http://localhost:8080/': {
        permissions: {
          snap_dialog: {
            invoker: 'local:http://localhost:8080/',
            parentCapability: 'snap_dialog',
            id: 'a7342F4b-beae-4525-a36c-c0635fd03359',
            date: 1620710693178,
            caveats: [],
          },
        },
      },
    },
    permissionActivityLog: [
      {
        id: 522690215,
        method: 'eth_accounts',
        methodType: 'restricted',
        origin: 'https://metamask.io',
        requestTime: 1602643170686,
        responseTime: 1602643170688,
        success: true,
      },
      {
        id: 1620464600,
        method: 'eth_accounts',
        methodType: 'restricted',
        origin: 'https://widget.getacute.io',
        requestTime: 1602643172935,
        responseTime: 1602643172935,
        success: true,
      },
      {
        id: 4279100021,
        method: 'eth_accounts',
        methodType: 'restricted',
        origin: 'https://app.uniswap.org',
        requestTime: 1620710669962,
        responseTime: 1620710669963,
        success: true,
      },
      {
        id: 4279100022,
        method: 'eth_requestAccounts',
        methodType: 'restricted',
        origin: 'https://app.uniswap.org',
        requestTime: 1620710686872,
        responseTime: 1620710693187,
        success: true,
      },
      {
        id: 4279100023,
        method: 'eth_requestAccounts',
        methodType: 'restricted',
        origin: 'https://app.uniswap.org',
        requestTime: 1620710693204,
        responseTime: 1620710693213,
        success: true,
      },
      {
        id: 4279100034,
        method: 'eth_accounts',
        methodType: 'restricted',
        origin: 'https://app.uniswap.org',
        requestTime: 1620710712072,
        responseTime: 1620710712075,
        success: true,
      },
    ],
    permissionHistory: {
      'https://metamask.github.io': {
        eth_accounts: {
          lastApproved: 1620710693213,
          accounts: {
            '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4': 1620710693213,
          },
        },
      },
    },
    ensResolutionsByAddress: {},
    pendingApprovals: {},
    pendingApprovalCount: 0,
    subjectMetadata: {
      'http://localhost:8080': {
        extensionId: null,
        iconUrl: null,
        name: 'Hello, Snaps!',
        origin: 'http://localhost:8080',
        subjectType: 'website',
      },
      'https://metamask.github.io': {
        extensionId: null,
        iconUrl: null,
        name: 'Snaps Iframe Execution Environment',
        origin: 'https://metamask.github.io',
        subjectType: 'website',
      },
      'local:http://localhost:8080/': {
        extensionId: null,
        iconUrl: null,
        name: 'MetaMask Example Snap',
        origin: 'local:http://localhost:8080/',
        subjectType: 'snap',
        svgIcon: '<svg>...</svg>',
        version: '0.6.0',
      },
    },
    notifications: {},
    database: {
      verifiedSnaps: {
        'local:http://localhost:8080/': {
          id: 'local:http://localhost:8080/',
          metadata: {
            name: 'BIP-44',
            author: {
              name: 'Consensys',
              website: 'https://consensys.io/',
            },
            website: 'https://snaps.consensys.io/',
            summary: 'An example Snap that signs messages using BLS.',
            description: 'An example Snap that signs messages using BLS.',
            audits: [
              {
                auditor: 'Consensys Diligence',
                report: 'https://consensys.io/diligence/audits/',
              },
            ],
            category: 'interoperability',
            support: {
              contact: 'https://github.com/MetaMask',
            },
            sourceCode: 'https://github.com/MetaMask/test-snaps',
          },
          versions: {
            '0.1.2': {
              checksum: 'L1k+dT9Q+y3KfIqzaH09MpDZVPS9ZowEh9w01ZMTWMU=',
            },
          },
        },
        'npm:@metamask/test-snap-bip44': {
          id: 'npm:@metamask/test-snap-bip44',
          metadata: {
            name: 'BIP-44',
            author: {
              name: 'Consensys',
              website: 'https://consensys.io/',
            },
            website: 'https://snaps.consensys.io/',
            summary: 'An example Snap that signs messages using BLS.',
            description: 'An example Snap that signs messages using BLS.',
            audits: [
              {
                auditor: 'Consensys Diligence',
                report: 'https://consensys.io/diligence/audits/',
              },
            ],
            category: 'interoperability',
            support: {
              contact: 'https://github.com/MetaMask',
            },
            sourceCode: 'https://github.com/MetaMask/test-snaps',
          },
          versions: {
            '5.1.2': {
              checksum: 'L1k+dT9Q+y3KfIqzaH09MpDZVPS9ZowEh9w01ZMTWMU=',
            },
            '5.1.3': {
              checksum: 'L1k+dT9Q+y3KfIqzaH09MpDZVPS9ZowEh9w01ZMTWMU=',
            },
          },
        },
      },
    },
  },
  appState: {
    shouldClose: false,
    menuOpen: false,
    modal: {
      open: false,
      modalState: {
        name: null,
        props: {
          token: {
            address: '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
            symbol: 'DAI',
            decimals: 18,
          },
          history: {},
        },
      },
      previousModalState: {
        name: null,
      },
    },
    sidebar: {
      isOpen: false,
      transitionName: '',
      type: '',
      props: {},
    },
    alertOpen: false,
    alertMessage: null,
    qrCodeData: null,
    networkDropdownOpen: false,
    accountDetail: {
      subview: 'transactions',
    },
    isLoading: false,
    warning: null,
    buyView: {},
    gasIsLoading: false,
    defaultHdPaths: {
      trezor: "m/44'/60'/0'/0",
      ledger: "m/44'/60'/0'/0/0",
    },
    networksTabSelectedRpcUrl: '',
    loadingMethodData: false,
    requestAccountTabs: {},
    openMetaMaskTabs: {},
    currentWindowTab: {},
  },
  history: {
    mostRecentOverviewPage: '/',
  },
  send: {
    toDropdownOpen: false,
    gasButtonGroupShown: true,
    errors: {},
    asset: {
      type: 'NATIVE',
      balance: '0x0',
      details: null,
    },
    gas: { error: 'gas' },
    amount: {
      error: 'amount',
    },
    currentTransactionUUID: 'test-uuid',
    draftTransactions: {
      'test-uuid': {
        ...draftTransactionInitialState,
      },
    },
  },
  confirmTransaction: {
    txData: {
      id: 3111025347726181,
      time: 1620723786838,
      status: 'unapproved',
      chainId: '0x5',
      loadingDefaults: false,
      txParams: {
        from: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
        to: '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
        value: '0x0',
        data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
        gas: '0xea60',
        gasPrice: '0x4a817c800',
      },
      type: 'transfer',
      origin: 'https://metamask.github.io',
      transactionCategory: 'approve',
      history: [
        {
          id: 3111025347726181,
          time: 1620723786838,
          status: 'unapproved',
          chainId: '0x5',
          loadingDefaults: true,
          txParams: {
            from: '0x983211ce699ea5ab57cc528086154b6db1ad8e55',
            to: '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
            value: '0x0',
            data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
            gas: '0xea60',
            gasPrice: '0x4a817c800',
          },
          type: 'standard',
          origin: 'https://metamask.github.io',
          transactionCategory: 'approve',
        },
        [
          {
            op: 'replace',
            path: '/loadingDefaults',
            value: false,
            note: 'Added new unapproved transaction.',
            timestamp: 1620723786844,
          },
        ],
      ],
    },
    tokenData: {
      args: [
        '0x9bc5baF874d2DA8D216aE9f137804184EE5AfEF4',
        {
          type: 'BigNumber',
          hex: '0x011170',
        },
      ],
      functionFragment: {
        type: 'function',
        name: 'approve',
        constant: false,
        inputs: [
          {
            name: '_spender',
            type: 'address',
            indexed: null,
            components: null,
            arrayLength: null,
            arrayChildren: null,
            baseType: 'address',
            _isParamType: true,
          },
          {
            name: '_value',
            type: 'uint256',
            indexed: null,
            components: null,
            arrayLength: null,
            arrayChildren: null,
            baseType: 'uint256',
            _isParamType: true,
          },
        ],
        outputs: [
          {
            name: 'success',
            type: 'bool',
            indexed: null,
            components: null,
            arrayLength: null,
            arrayChildren: null,
            baseType: 'bool',
            _isParamType: true,
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        gas: null,
        _isFragment: true,
      },
      name: 'approve',
      signature: 'approve(address,uint256)',
      sighash: '0x095ea7b3',
      value: {
        type: 'BigNumber',
        hex: '0x00',
      },
    },
    fiatTransactionAmount: '0',
    fiatTransactionFee: '4.72',
    fiatTransactionTotal: '4.72',
    ethTransactionAmount: '0',
    ethTransactionFee: '0.0012',
    ethTransactionTotal: '0.0012',
    hexTransactionAmount: '0x0',
    hexTransactionFee: '0x44364c5bb0000',
    hexTransactionTotal: '0x44364c5bb0000',
    nonce: '',
  },
  swaps: {
    aggregatorMetadata: null,
    approveTxId: null,
    balanceError: false,
    fetchingQuotes: false,
    fromToken: null,
    quotesFetchStartTime: null,
    topAssets: {},
    toToken: null,
    customGas: {
      price: null,
      limit: null,
      loading: 'INITIAL',
      priceEstimates: {},
      fallBackPrice: null,
    },
  },
  gas: {
    customData: {
      price: null,
      limit: '0xcb28',
    },
    basicEstimates: {
      average: 2,
    },
    basicEstimateIsLoading: false,
  },
};

export const networkList = [
  {
    blockExplorerUrl: 'https://etherscan.io',
    chainId: '0x1',
    iconColor: 'var(--mainnet)',
    isATestNetwork: false,
    labelKey: 'mainnet',
    providerType: 'mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    ticker: 'ETH',
    viewOnly: true,
  },
  {
    blockExplorerUrl: 'https://goerli.etherscan.io',
    chainId: '0x5',
    iconColor: 'var(--color-network-goerli-default)',
    isATestNetwork: true,
    labelKey: 'goerli',
    providerType: 'goerli',
    rpcUrl: 'https://goerli.infura.io/v3/',
    ticker: 'ETH',
    viewOnly: true,
  },
  {
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    chainId: '0xaa36a7',
    iconColor: 'var(--color-network-sepolia-default)',
    isATestNetwork: true,
    labelKey: 'sepolia',
    providerType: 'sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    ticker: 'ETH',
    viewOnly: true,
  },
  {
    blockExplorerUrl: '',
    chainId: '0x539',
    iconColor: 'var(--color-network-localhost-default)',
    isATestNetwork: true,
    label: 'Localhost 8545',
    providerType: 'rpc',
    rpcUrl: 'http://localhost:8545',
    ticker: 'ETH',
  },
  {
    blockExplorerUrl: 'https://bscscan.com',
    chainId: '0x38',
    iconColor: 'var(--color-network-localhost-default)',
    isATestNetwork: false,
    label: 'Binance Smart Chain',
    providerType: 'rpc',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    ticker: 'BNB',
  },
  {
    blockExplorerUrl: 'https://cchain.explorer.avax.network/',
    chainId: '0xa86a',
    iconColor: 'var(--color-network-localhost-default)',
    isATestNetwork: false,
    label: 'Avalanche',
    providerType: 'rpc',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    ticker: 'AVAX',
  },
  {
    blockExplorerUrl: 'https://polygonscan.com',
    chainId: '0x89',
    iconColor: 'var(--color-network-localhost-default)',
    isATestNetwork: false,
    label: 'Polygon',
    providerType: 'rpc',
    rpcUrl: 'https://polygon-rpc.com',
    ticker: 'MATIC',
  },
];

export default state;
