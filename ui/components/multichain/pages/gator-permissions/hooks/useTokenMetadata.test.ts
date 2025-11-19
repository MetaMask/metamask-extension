import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import log from 'loglevel';
import * as actions from '../../../../../store/actions';
import type { TokenStandAndDetails } from '../../../../../store/actions';
import { useTokenMetadata } from './useTokenMetadata';
import type { TokenMetadata } from './useTokenMetadata';

const mockFetchAssetMetadata = jest.fn();

jest.mock('../../../../../store/actions', () => ({
  getTokenStandardAndDetailsByChain: jest.fn(),
}));

jest.mock('../../../../../../shared/lib/asset-utils', () => ({
  fetchAssetMetadata: (...args: unknown[]) => mockFetchAssetMetadata(...args),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(() => ({ address: '0xUserAddress' })),
}));

jest.mock('loglevel', () => ({
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('useTokenMetadata', () => {
  const mockGetTokenStandardAndDetailsByChain =
    actions.getTokenStandardAndDetailsByChain as jest.MockedFunction<
      typeof actions.getTokenStandardAndDetailsByChain
    >;

  // Test constants
  const MOCK_NATIVE_TOKEN: TokenMetadata = {
    symbol: 'ETH',
    decimals: 18,
  };

  const UNKNOWN_TOKEN: TokenMetadata = {
    symbol: 'Unknown Token',
    decimals: null,
  };

  const CHAIN_ID = '0x1';
  const EMPTY_TOKENS_BY_CHAIN = { [CHAIN_ID]: { data: {} } };

  // Test types
  type TokensByChain = Record<
    string,
    {
      data: Record<
        string,
        { symbol?: string; decimals?: number; name?: string }
      >;
    }
  >;

  // Test helpers
  function renderTokenMetadata(
    tokenAddress?: string,
    options?: Partial<{
      chainId: string;
      tokensByChain: TokensByChain;
      nativeTokenMetadata: TokenMetadata;
    }>,
  ) {
    return renderHook(() =>
      useTokenMetadata(
        tokenAddress,
        options?.chainId || CHAIN_ID,
        options?.tokensByChain || EMPTY_TOKENS_BY_CHAIN,
        options?.nativeTokenMetadata || MOCK_NATIVE_TOKEN,
      ),
    );
  }

  function createTokensByChain(
    chainId: string,
    tokens: Record<
      string,
      { symbol?: string; decimals?: number; name?: string }
    >,
  ): TokensByChain {
    return { [chainId]: { data: tokens } };
  }

  function mockOnChainResponse(
    symbol: string,
    decimals: string | number,
    name: string,
  ): void {
    mockGetTokenStandardAndDetailsByChain.mockResolvedValue({
      symbol,
      decimals: typeof decimals === 'number' ? decimals.toString() : decimals,
      name,
      standard: 'ERC20',
    } as TokenStandAndDetails);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchAssetMetadata.mockResolvedValue(undefined);
  });

  describe('Native Token', () => {
    it('should return native token metadata when tokenAddress is undefined or empty', () => {
      const { result } = renderTokenMetadata(undefined);
      expect(result.current).toEqual(MOCK_NATIVE_TOKEN);

      const { result: result2 } = renderTokenMetadata('');
      expect(result2.current).toEqual(MOCK_NATIVE_TOKEN);
    });

    it('should handle changing native token metadata', () => {
      const { result, rerender } = renderHook(
        ({ nativeTokenMetadata }) =>
          useTokenMetadata(undefined, CHAIN_ID, {}, nativeTokenMetadata),
        {
          initialProps: {
            nativeTokenMetadata: { symbol: 'ETH', decimals: 18 },
          },
        },
      );

      expect(result.current).toEqual({ symbol: 'ETH', decimals: 18 });

      rerender({
        nativeTokenMetadata: { symbol: 'MATIC', decimals: 18 },
      });

      expect(result.current).toEqual({ symbol: 'MATIC', decimals: 18 });
    });
  });

  describe('Cached Token Metadata', () => {
    it('should return token metadata from state and handle edge cases', () => {
      // Normal cached token
      const { result } = renderTokenMetadata('0xTokenAddress', {
        tokensByChain: createTokensByChain(CHAIN_ID, {
          '0xTokenAddress': {
            symbol: 'DAI',
            decimals: 18,
            name: 'Dai Stablecoin',
          },
        }),
      });

      expect(result.current).toEqual({
        symbol: 'DAI',
        decimals: 18,
      });

      // Should not make any external calls
      expect(mockFetchAssetMetadata).not.toHaveBeenCalled();
      expect(mockGetTokenStandardAndDetailsByChain).not.toHaveBeenCalled();

      // Case-insensitive addresses
      const { result: result2 } = renderTokenMetadata('0xTokenAddress', {
        tokensByChain: createTokensByChain(CHAIN_ID, {
          '0xtokenaddress': { symbol: 'USDC', decimals: 6, name: 'USD Coin' },
        }),
      });

      expect(result2.current).toEqual({
        symbol: 'USDC',
        decimals: 6,
      });

      // Missing symbol
      const { result: result3 } = renderTokenMetadata('0xTokenAddress', {
        tokensByChain: createTokensByChain(CHAIN_ID, {
          '0xTokenAddress': { decimals: 18 },
        }),
      });

      expect(result3.current).toEqual({
        symbol: 'Unknown Token',
        decimals: 18,
      });
    });
  });

  describe('API Token Metadata', () => {
    it('should fetch metadata from API and handle fallback scenarios', async () => {
      // Successful API fetch
      const tokenAddress = '0xApiToken';
      mockFetchAssetMetadata.mockResolvedValue({
        symbol: 'API_TOKEN',
        decimals: 18,
        address: tokenAddress,
        chainId: CHAIN_ID,
      });

      const { result } = renderTokenMetadata(tokenAddress);

      await waitFor(() => {
        expect(result.current).toEqual({
          symbol: 'API_TOKEN',
          decimals: 18,
        });
      });

      expect(mockFetchAssetMetadata).toHaveBeenCalledWith(
        tokenAddress,
        CHAIN_ID,
        undefined,
      );

      // API returns undefined, falls back to on-chain
      mockFetchAssetMetadata.mockResolvedValue(undefined);
      mockOnChainResponse('cUSDC', '6', 'Compound USD Coin');

      const { result: result2 } = renderTokenMetadata('0xNewTokenAddress');

      await waitFor(() => {
        expect(result2.current).toEqual({
          symbol: 'cUSDC',
          decimals: 6,
        });
      });

      expect(mockGetTokenStandardAndDetailsByChain).toHaveBeenCalled();

      // API error, falls back to on-chain
      mockFetchAssetMetadata.mockRejectedValue(new Error('API error'));
      mockOnChainResponse('FALLBACK', '18', 'Fallback Token');

      const { result: result3 } = renderTokenMetadata('0xFailingTokenAddress');

      await waitFor(() => {
        expect(result3.current).toEqual({
          symbol: 'FALLBACK',
          decimals: 18,
        });
      });

      expect(log.debug).toHaveBeenCalledWith(
        'Token API fetch failed, falling back to on-chain',
        expect.objectContaining({
          tokenAddress: '0xFailingTokenAddress',
          chainId: CHAIN_ID,
          error: 'API error',
        }),
      );
    });
  });

  describe('On-Chain Token Metadata', () => {
    it('should handle on-chain errors and null responses', async () => {
      // On-chain fetch error
      mockFetchAssetMetadata.mockRejectedValue(new Error('API error'));
      mockGetTokenStandardAndDetailsByChain.mockRejectedValue(
        new Error('On-chain error'),
      );

      const { result } = renderTokenMetadata('0xFailingTokenAddress');

      await waitFor(() =>
        expect(mockGetTokenStandardAndDetailsByChain).toHaveBeenCalled(),
      );

      expect(result.current).toEqual(UNKNOWN_TOKEN);
      expect(log.error).toHaveBeenCalledWith(
        'Failed to fetch token metadata from on-chain',
        {
          tokenAddress: '0xFailingTokenAddress',
          chainId: CHAIN_ID,
          selectedAccountAddress: '0xUserAddress',
          error: 'On-chain error',
        },
      );

      // Null response from on-chain
      mockGetTokenStandardAndDetailsByChain.mockResolvedValue(
        null as unknown as TokenStandAndDetails,
      );

      const { result: result2 } = renderTokenMetadata('0xNonExistentToken');

      await waitFor(() =>
        expect(mockGetTokenStandardAndDetailsByChain).toHaveBeenCalled(),
      );

      expect(result2.current).toEqual(UNKNOWN_TOKEN);
    });
  });

  describe('Decimals Parsing', () => {
    it('should handle various decimal formats', async () => {
      const testCases = [
        { decimals: undefined, expected: null, name: 'UndefinedToken' },
        { decimals: '0', expected: 0, name: 'ZeroStringToken' },
        { decimals: 0, expected: 0, name: 'ZeroNumberToken' },
        { decimals: '18', expected: 18, name: 'NormalToken' },
        { decimals: '', expected: null, name: 'EmptyToken' },
      ];

      for (const { decimals, expected, name } of testCases) {
        mockGetTokenStandardAndDetailsByChain.mockResolvedValue({
          decimals,
          name,
          standard: 'ERC20',
        } as TokenStandAndDetails);

        const { result } = renderTokenMetadata(`0x${name}`);

        await waitFor(() => {
          expect(result.current.decimals).toBe(expected);
        });
      }
    });
  });

  describe('Dynamic Updates', () => {
    it('should update when tokenAddress or chainId changes', async () => {
      // Test tokenAddress change
      const { result, rerender } = renderHook(
        ({ tokenAddress }) =>
          useTokenMetadata(
            tokenAddress,
            CHAIN_ID,
            createTokensByChain(CHAIN_ID, {
              '0xToken1': { symbol: 'TKN1', decimals: 18, name: 'Token 1' },
            }),
            MOCK_NATIVE_TOKEN,
          ),
        { initialProps: { tokenAddress: '0xToken1' } },
      );

      expect(result.current.symbol).toBe('TKN1');

      mockOnChainResponse('TKN2', '6', 'Token 2');
      rerender({ tokenAddress: '0xToken2' });

      await waitFor(() => expect(result.current.symbol).toBe('TKN2'));

      // Test chainId change
      const tokensByChain = {
        ...createTokensByChain(CHAIN_ID, {
          '0xusdc': {
            symbol: 'USDC-ETH',
            decimals: 6,
            name: 'USD Coin on Ethereum',
          },
        }),
        ...createTokensByChain('0x89', {
          '0xusdc': {
            symbol: 'USDC-POLY',
            decimals: 6,
            name: 'USD Coin on Polygon',
          },
        }),
      };

      const { result: result2, rerender: rerender2 } = renderHook(
        ({ chainId }) =>
          useTokenMetadata('0xUSDC', chainId, tokensByChain, MOCK_NATIVE_TOKEN),
        { initialProps: { chainId: CHAIN_ID } },
      );

      expect(result2.current.symbol).toBe('USDC-ETH');

      rerender2({ chainId: '0x89' });

      await waitFor(() => expect(result2.current.symbol).toBe('USDC-POLY'));
    });
  });

  describe('Component Lifecycle', () => {
    it('should not update state after unmounting', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetchAssetMetadata.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined), 50)),
      );

      mockGetTokenStandardAndDetailsByChain.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() =>
              resolve({
                symbol: 'SLOW',
                decimals: '18',
                name: 'Slow Token',
                standard: 'ERC20',
              } as TokenStandAndDetails),
            100),
          ),
      );

      const { unmount } = renderTokenMetadata('0xSlowToken');
      unmount();

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('unmounted component'),
      );

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
