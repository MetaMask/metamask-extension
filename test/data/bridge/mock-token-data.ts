import { EthScope } from '@metamask/keyring-api';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { toChecksumHexAddress } from '@metamask/controller-utils';

// Account IDs aligned with createBridgeMockStore MOCK_EVM_* accounts.
export const MOCK_TOKEN_ACCOUNT_1_ID = 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3';
export const MOCK_TOKEN_ACCOUNT_2_ID = '07c2cfec-36c9-46c4-8115-3836d3ac9047';

const UNI = toChecksumHexAddress('0x1f9840a85d5af5bf1d1762f925bdaddc4201f984');
const LINK = toChecksumHexAddress('0x514910771af9ca656af840dff83e8264ecf986ca');
const SUSHI = toChecksumHexAddress(
  '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
);
const COMP = toChecksumHexAddress('0xc00e94cb662c3520282e6f5717214004a7f26888');

const uniMainnet = `eip155:1/erc20:${UNI}`;
const linkMainnet = `eip155:1/erc20:${LINK}`;
const sushiMainnet = `eip155:1/erc20:${SUSHI}`;
const uniLinea = `eip155:59144/erc20:${UNI}`;
const sushiLinea = `eip155:59144/erc20:${SUSHI}`;
const linkLinea = `eip155:59144/erc20:${LINK}`;
const compLinea = `eip155:59144/erc20:${COMP}`;
const linkOptimism = `eip155:10/erc20:${LINK}`;
const compOptimism = `eip155:10/erc20:${COMP}`;

const ethMainnet = 'eip155:1/slip44:60';
const ethLinea = 'eip155:59144/slip44:60';
const ethOptimism = 'eip155:10/slip44:60';

export const mockTokenData = {
  assetsInfo: {
    [ethMainnet]: { type: 'native', decimals: 18, symbol: 'ETH' },
    [ethLinea]: { type: 'native', decimals: 18, symbol: 'ETH' },
    [ethOptimism]: { type: 'native', decimals: 18, symbol: 'ETH' },
    [uniMainnet]: {
      type: 'erc20',
      symbol: 'UNI',
      decimals: 6,
      name: 'Uniswap',
    },
    [linkMainnet]: {
      type: 'erc20',
      symbol: 'LINK',
      decimals: 9,
      name: 'Link',
    },
    [sushiMainnet]: {
      type: 'erc20',
      symbol: 'SUSHI',
      decimals: 18,
      name: 'Sushi',
    },
    [uniLinea]: {
      type: 'erc20',
      symbol: 'UNI',
      decimals: 10,
      name: 'Uniswap',
    },
    [sushiLinea]: {
      type: 'erc20',
      symbol: 'SUSHI',
      decimals: 18,
      name: 'Sushi',
    },
    [linkLinea]: {
      type: 'erc20',
      symbol: 'LINK',
      decimals: 9,
      name: 'Link',
    },
    [compLinea]: {
      type: 'erc20',
      symbol: 'COMP',
      decimals: 6,
      name: 'Compound',
    },
    [linkOptimism]: {
      type: 'erc20',
      symbol: 'LINK',
      decimals: 9,
      name: 'Link',
    },
    [compOptimism]: {
      type: 'erc20',
      symbol: 'COMP',
      decimals: 6,
      name: 'Compound',
    },
  },
  assetsBalance: {
    [MOCK_TOKEN_ACCOUNT_1_ID]: {
      [ethMainnet]: { amount: '0.01' },
      [ethLinea]: { amount: '1.0000125' },
      [ethOptimism]: { amount: '1.0000125' },
      // tokenBalances: 0x738 @ 6 decimals, 0x1 @ 9 decimals
      [uniMainnet]: { amount: '0.001848' },
      [linkMainnet]: { amount: '0.000000001' },
      [uniLinea]: { amount: '0' },
      [linkLinea]: { amount: '9003.2030001' },
      [compLinea]: { amount: '412.340001' },
      [linkOptimism]: { amount: '9535.2030001' },
      [compOptimism]: { amount: '5.030001' },
      // Legacy allTokens also listed sushi under a second address; attach here
      // so token metadata remains available without an extra internal account.
      [sushiMainnet]: { amount: '0' },
      [sushiLinea]: { amount: '0' },
    },
    [MOCK_TOKEN_ACCOUNT_2_ID]: {
      [ethMainnet]: { amount: '1.0000125' },
      [ethLinea]: { amount: '0.000000000000000014' },
      [ethOptimism]: { amount: '0.000000000000000014' },
    },
  },
  customAssets: {},
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
  // Kept for createBridgeMockStore to merge into internalAccounts.
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
};
