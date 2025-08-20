import { EthScope } from '@metamask/keyring-api';
import { CHAIN_IDS } from '@metamask/transaction-controller';

export const mockTokenData = {
  allTokens: {
    [CHAIN_IDS.MAINNET]: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [
        {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          balance: 'a',
          decimals: 6,
        },
        {
          address: '0x514910771af9ca656af840dff83e8264ecf986ca',
          balance: 'e',
        },
      ],
      '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': [
        {
          address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
          balance: 'e',
        },
      ],
    },
    [CHAIN_IDS.LINEA_MAINNET]: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [
        {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          balance: 'e',
        },
      ],
      '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': [
        {
          address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
          balance: 'e',
        },
      ],
    },
  },
  internalAccounts: {
    selectedAccount: 'account-1',
    accounts: {
      'account-1': {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        balance: '0xa',
        type: 'eip155:eoa',
        metadata: {
          lastSelected: 1755717637857,
        },
        scopes: [EthScope.Eoa],
      },
    },
  },
  accountsByChainId: {
    [CHAIN_IDS.MAINNET]: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        balance: '0xa',
      },
      '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
        address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
        balance: '0xe',
      },
    },
    [CHAIN_IDS.LINEA_MAINNET]: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        balance: '0xe',
      },
      '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
        address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
        balance: '0xe',
      },
    },
  },
  tokensChainsCache: {
    [CHAIN_IDS.MAINNET]: {
      timestamp: 111111,
      data: [
        {
          address: '0x514910771af9ca656af840dff83e8264ecf986ca',
          symbol: 'LINK',
          decimals: 18,
        },
        {
          address: '0xc00e94cb662c3520282e6f5717214004a7f26888',
          symbol: 'COMP',
          decimals: 18,
        },
      ],
    },
    [CHAIN_IDS.LINEA_MAINNET]: {
      timestamp: 111111,
      data: {
        '0x514910771af9ca656af840dff83e8264ecf986ca': {
          address: '0x514910771af9ca656af840dff83e8264ecf986ca',
          symbol: 'LINK',
          decimals: 18,
        },
        '0xc00e94cb662c3520282e6f5717214004a7f26888': {
          address: '0xc00e94cb662c3520282e6f5717214004a7f26888',
          symbol: 'COMP',
          decimals: 18,
        },
      },
    },
  },
  tokenBalances: {
    '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
      '0x5': {},
      '0x1': {
        '0x514910771af9ca656af840dff83e8264ecf986ca': '0x1',
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': '0x738',
      },
    },
  },
};
