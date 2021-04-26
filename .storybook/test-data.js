import { TRANSACTION_STATUSES } from '../shared/constants/transaction';

const state = {
  metamask: {
    isInitialized: true,
    isUnlocked: true,
    featureFlags: { sendHexData: true },
    identities: {
      '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825': {
        address: '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825',
        name: 'Send Account 1',
      },
      '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb': {
        address: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
        name: 'Send Account 2',
      },
      '0x2f8d4a878cfa04a6e60d46362f5644deab66572d': {
        address: '0x2f8d4a878cfa04a6e60d46362f5644deab66572d',
        name: 'Send Account 3',
      },
      '0xd85a4b6a394794842887b8284293d69163007bbb': {
        address: '0xd85a4b6a394794842887b8284293d69163007bbb',
        name: 'Send Account 4',
      },
    },
    cachedBalances: {},
    currentBlockGasLimit: '0x4c1878',
    currentCurrency: 'USD',
    conversionRate: 1200.88200327,
    conversionDate: 1489013762,
    nativeCurrency: 'ETH',
    frequentRpcList: [],
    network: '3',
    provider: {
      type: 'ropsten',
      chainId: '0x3',
    },
    accounts: {
      '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825': {
        code: '0x',
        balance: '0x47c9d71831c76efe',
        nonce: '0x1b',
        address: '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825',
      },
      '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb': {
        code: '0x',
        balance: '0x37452b1315889f80',
        nonce: '0xa',
        address: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
      },
      '0x2f8d4a878cfa04a6e60d46362f5644deab66572d': {
        code: '0x',
        balance: '0x30c9d71831c76efe',
        nonce: '0x1c',
        address: '0x2f8d4a878cfa04a6e60d46362f5644deab66572d',
      },
      '0xd85a4b6a394794842887b8284293d69163007bbb': {
        code: '0x',
        balance: '0x0',
        nonce: '0x0',
        address: '0xd85a4b6a394794842887b8284293d69163007bbb',
      },
    },
    addressBook: {
      '0x3': {
        '0x06195827297c7a80a443b6894d3bdb8824b43896': {
          address: '0x06195827297c7a80a443b6894d3bdb8824b43896',
          name: 'Address Book Account 1',
          chainId: '0x3',
        },
      },
    },
    tokens: [
      {
        address: '0x1a195821297c7a80a433b6894d3bdb8824b43896',
        decimals: 18,
        symbol: 'ABC',
      },
      {
        address: '0x8d6b81208414189a58339873ab429b6c47ab92d3',
        decimals: 4,
        symbol: 'DEF',
      },
      {
        address: '0xa42084c8d1d9a2198631988579bb36b48433a72b',
        decimals: 18,
        symbol: 'GHI',
      },
    ],
    transactions: {},
    currentNetworkTxList: [
      {
        id: 'mockTokenTx1',
        txParams: {
          to: '0x8d6b81208414189a58339873ab429b6c47ab92d3',
          from: '0xd85a4b6a394794842887b8284293d69163007bbb',
        },
        time: 1700000000000,
      },
      {
        id: 'mockTokenTx2',
        txParams: {
          to: '0xafaketokenaddress',
          from: '0xd85a4b6a394794842887b8284293d69163007bbb',
        },
        time: 1600000000000,
      },
      {
        id: 'mockTokenTx3',
        txParams: {
          to: '0x8d6b81208414189a58339873ab429b6c47ab92d3',
          from: '0xd85a4b6a394794842887b8284293d69163007bbb',
        },
        time: 1500000000000,
      },
      {
        id: 'mockEthTx1',
        txParams: {
          to: '0xd85a4b6a394794842887b8284293d69163007bbb',
          from: '0xd85a4b6a394794842887b8284293d69163007bbb',
        },
        time: 1400000000000,
      },
    ],
    unapprovedMsgs: {
      '0xabc': { id: 'unapprovedMessage1', time: 1650000000000 },
      '0xdef': { id: 'unapprovedMessage2', time: 1550000000000 },
      '0xghi': { id: 'unapprovedMessage3', time: 1450000000000 },
    },
    unapprovedMsgCount: 0,
    unapprovedPersonalMsgs: {},
    unapprovedPersonalMsgCount: 0,
    unapprovedDecryptMsgs: {},
    unapprovedDecryptMsgCount: 0,
    unapprovedEncryptionPublicKeyMsgs: {},
    unapprovedEncryptionPublicKeyMsgCount: 0,
    keyringTypes: ['Simple Key Pair', 'HD Key Tree'],
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: [
          'fdea65c8e26263f6d9a1b5de9555d2931a33b825',
          'c5b8dbac4c1d3f152cdeb400e2313f309c410acb',
          '2f8d4a878cfa04a6e60d46362f5644deab66572d',
        ],
      },
      {
        type: 'Simple Key Pair',
        accounts: ['0xd85a4b6a394794842887b8284293d69163007bbb'],
      },
    ],
    selectedAddress: '0xd85a4b6a394794842887b8284293d69163007bbb',
    send: {
      gasLimit: '0xFFFF',
      gasPrice: '0xaa',
      gasTotal: '0xb451dc41b578',
      tokenBalance: 3434,
      from: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
      to: '0x987fedabc',
      amount: '0x080',
      memo: '',
      errors: {
        someError: null,
      },
      maxModeOn: false,
      editingTransactionId: 97531,
    },
    unapprovedTxs: {
      4768706228115573: {
        id: 4768706228115573,
        time: 1487363153561,
        status: TRANSACTION_STATUSES.UNAPPROVED,
        gasMultiplier: 1,
        metamaskNetworkId: '3',
        txParams: {
          from: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
          to: '0x18a3462427bcc9133bb46e88bcbe39cd7ef0e761',
          value: '0xde0b6b3a7640000',
          metamaskId: 4768706228115573,
          metamaskNetworkId: '3',
          gas: '0x5209',
        },
        txFee: '17e0186e60800',
        txValue: 'de0b6b3a7640000',
        maxCost: 'de234b52e4a0800',
        gasPrice: '4a817c800',
      },
    },
    currentLocale: 'en',
  },
  appState: {
    menuOpen: false,
    currentView: {
      name: 'accountDetail',
      detailView: null,
      context: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    },
    accountDetail: {
      subview: 'transactions',
    },
    modal: {
      modalState: {},
      previousModalState: {},
    },
    isLoading: false,
    warning: null,
    scrollToBottom: false,
    forgottenPassword: null,
  },
  send: {
    fromDropdownOpen: false,
    toDropdownOpen: false,
    errors: { someError: null },
  },
};

export default state;
