import { EthScope } from '@metamask/keyring-api';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { decimalToPrefixedHex } from '../../../shared/modules/conversion.utils';

export const mockTokenData = {
  allTokens: {
    [CHAIN_IDS.MAINNET]: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [
        {
          address: toChecksumHexAddress(
            '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          ),
          decimals: 6,
        },
        {
          address: toChecksumHexAddress(
            '0x514910771af9ca656af840dff83e8264ecf986ca',
          ),
        },
      ],
      '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': [
        {
          address: toChecksumHexAddress(
            '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
          ),
        },
      ],
    },
    [CHAIN_IDS.LINEA_MAINNET]: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [
        {
          address: toChecksumHexAddress(
            '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          ),
        },
      ],
      '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': [
        {
          address: toChecksumHexAddress(
            '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
          ),
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
      '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc': {
        balance: decimalToPrefixedHex('10000000000000000'),
      },
      '0xEC1Adf982415D2Ef5ec55899b9Bfb8BC0f29251B': {
        balance: decimalToPrefixedHex('500000000000000000'),
      },
      '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb': {
        balance: decimalToPrefixedHex('1000012500000000000'),
      },
    },
    [CHAIN_IDS.LINEA_MAINNET]: {
      '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc': {
        balance: decimalToPrefixedHex('1000012500000000000'),
      },
      '0xEC1Adf982415D2Ef5ec55899b9Bfb8BC0f29251B': {
        balance: '0xe',
      },
      '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb': {
        balance: '0xe',
      },
    },
    [CHAIN_IDS.OPTIMISM]: {
      '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc': {
        balance: decimalToPrefixedHex('1000012500000000000'),
      },
      '0xEC1Adf982415D2Ef5ec55899b9Bfb8BC0f29251B': {
        balance: '0xe',
      },
      '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb': {
        balance: '0xe',
      },
    },
  },
  tokensChainsCache: {
    [CHAIN_IDS.MAINNET]: {
      timestamp: 111111,
      data: {
        '0x514910771af9ca656af840dff83e8264ecf986ca': {
          address: '0x514910771af9ca656af840dff83e8264ecf986ca',
          symbol: 'LINK',
          decimals: 9,
          name: 'Link',
        },
        '0xc00e94cb662c3520282e6f5717214004a7f26888': {
          address: '0xc00e94cb662c3520282e6f5717214004a7f26888',
          symbol: 'COMP',
          decimals: 6,
          name: 'Compound',
        },
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          symbol: 'UNI',
          decimals: 10,
          name: 'Uniswap',
        },
      },
    },
    [CHAIN_IDS.LINEA_MAINNET]: {
      timestamp: 111111,
      data: {
        '0x514910771af9ca656af840dff83e8264ecf986ca': {
          address: '0x514910771af9ca656af840dff83e8264ecf986ca',
          symbol: 'LINK',
          decimals: 9,
          name: 'Link',
        },
        '0xc00e94cb662c3520282e6f5717214004a7f26888': {
          address: '0xc00e94cb662c3520282e6f5717214004a7f26888',
          symbol: 'COMP',
          decimals: 6,
          name: 'Compound',
        },
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          symbol: 'UNI',
          decimals: 10,
          name: 'Uniswap',
        },
      },
    },
    [CHAIN_IDS.OPTIMISM]: {
      timestamp: 111111,
      data: {
        '0x514910771af9ca656af840dff83e8264ecf986ca': {
          address: '0x514910771af9ca656af840dff83e8264ecf986ca',
          symbol: 'LINK',
          decimals: 9,
          name: 'Link',
        },
        '0xc00e94cb662c3520282e6f5717214004a7f26888': {
          address: '0xc00e94cb662c3520282e6f5717214004a7f26888',
          symbol: 'COMP',
          decimals: 6,
          name: 'Compound',
        },
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          symbol: 'UNI',
          decimals: 10,
          name: 'Uniswap',
        },
      },
    },
  },
  tokenBalances: {
    '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
      '0x5': {},
      '0x1': {
        [toChecksumHexAddress('0x514910771af9ca656af840dff83e8264ecf986ca')]:
          '0x1',
        [toChecksumHexAddress('0x1f9840a85d5af5bf1d1762f925bdaddc4201f984')]:
          '0x738',
      },
      [CHAIN_IDS.LINEA_MAINNET]: {
        '0x514910771af9ca656af840dff83e8264ecf986ca':
          decimalToPrefixedHex('9003203000100'),
        '0xc00e94cb662c3520282e6f5717214004a7f26888':
          decimalToPrefixedHex('412340001'),
      },
      [CHAIN_IDS.OPTIMISM]: {
        '0x514910771af9ca656af840dff83e8264ecf986ca':
          decimalToPrefixedHex('9535203000100'),
        '0xc00e94cb662c3520282e6f5717214004a7f26888':
          decimalToPrefixedHex('5030001'),
      },
    },
  },
};
