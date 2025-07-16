/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-dom/test-utils';
import { getAllTokens } from '../selectors';
import { getCurrentChainId } from '../../shared/modules/selectors/networks';
import { useGetFormattedTokensPerChain } from './useGetFormattedTokensPerChain';
import { stringifyBalance } from './useTokenBalances';

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => selector()),
}));

jest.mock('../../shared/modules/selectors/networks', () => ({
  getCurrentChainId: jest.fn(),
}));

jest.mock('../selectors', () => ({
  getAllTokens: jest.fn(),
}));

const mockGetAllTokens = getAllTokens as jest.Mock;
const mockGetCurrentChainId = getCurrentChainId as jest.Mock;

const mockUseTokenBalances = jest.fn().mockReturnValue({
  tokenBalances: {
    '0xac7985f2e57609bdd7ad3003e4be868d83e4b6d5': {
      '0x1': {
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': '0x2f18e6',
        '0x6B175474E89094C44Da98b954EedeAC495271d0F': '0x378afc9a77b47a30',
      },
    },
  },
});
jest.mock('./useTokenBalances', () => ({
  useTokenBalances: () => mockUseTokenBalances(),
  stringifyBalance: jest.fn(),
}));

const allTokens = {
  '0x1': {
    '0xac7985f2e57609bdd7ad3003e4be868d83e4b6d5': [
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        aggregators: [
          'Metamask',
          'Aave',
          'Bancor',
          'Crypto.com',
          '1inch',
          'PMM',
          'Sushiswap',
          'Zerion',
          'Lifi',
          'Socket',
          'Squid',
          'Openswap',
          'UniswapLabs',
          'Coinmarketcap',
        ],
        decimals: 6,
        symbol: 'USDC',
      },
      {
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        aggregators: [
          'Metamask',
          'Aave',
          'Bancor',
          'CMC',
          'Crypto.com',
          '1inch',
          'PMM',
          'Sushiswap',
          'Zerion',
          'Lifi',
          'Socket',
          'Squid',
          'Openswap',
          'UniswapLabs',
          'Coinmarketcap',
        ],
        decimals: 18,
        symbol: 'DAI',
      },
    ],
  },
};

describe('useGetFormattedTokensPerChain', () => {
  beforeEach(() => {
    mockGetAllTokens.mockReturnValue(allTokens);
    mockGetCurrentChainId.mockReturnValue('0x1');

    jest.clearAllMocks();
  });
  it('should tokensWithBalances for an array of chainIds', async () => {
    (stringifyBalance as jest.Mock).mockReturnValueOnce(10.5);
    (stringifyBalance as jest.Mock).mockReturnValueOnce(13);
    const allChainIDs = ['0x1'];
    const isTokenNetworkFilterEqualCurrentNetwork = true;
    const shouldHideZeroBalanceTokens = true;
    const testAccount = {
      id: '7d3a1213-c465-4995-b42a-85e2ccfd2f22',
      address: '0xac7985f2e57609bdd7ad3003e4be868d83e4b6d5',
      options: {},
      methods: [
        'personal_sign',
        'eth_sign',
        'eth_signTransaction',
        'eth_signTypedData_v1',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
      ],
    };

    const expectedResult = {
      formattedTokensWithBalancesPerChain: [
        {
          chainId: '0x1',
          tokensWithBalances: [
            {
              address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              balance: '3086566',
              decimals: 6,
              string: 10.5,
              symbol: 'USDC',
            },
            {
              address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
              balance: '4002288959235586608',
              decimals: 18,
              string: 13,
              symbol: 'DAI',
            },
          ],
        },
      ],
    };

    let result;
    await act(async () => {
      result = renderHook(() =>
        useGetFormattedTokensPerChain(
          testAccount,
          shouldHideZeroBalanceTokens,
          isTokenNetworkFilterEqualCurrentNetwork,
          allChainIDs,
        ),
      );
    });

    expect((result as unknown as Record<string, any>).result.current).toEqual(
      expectedResult,
    );
  });
});
