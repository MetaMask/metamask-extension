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
    it('should return native token metadata when tokenAddress is undefined', () => {
      const { result } = renderTokenMetadata(undefined);
      expect(result.current).toEqual(MOCK_NATIVE_TOKEN);
    });

    it('should return native token metadata when tokenAddress is empty string', () => {
      const { result } = renderTokenMetadata('');
      expect(result.current).toEqual(MOCK_NATIVE_TOKEN);
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

    it('should prevent infinite loops with unstable native token references', () => {
      let renderCount = 0;
      const { result, rerender } = renderHook(
        ({ nativeTokenMetadata }) => {
          renderCount += 1;
          return useTokenMetadata(undefined, CHAIN_ID, {}, nativeTokenMetadata);
        },
        {
          initialProps: {
            nativeTokenMetadata: { symbol: 'ETH', decimals: 18 },
          },
        },
      );

      const initialRenderCount = renderCount;
      expect(result.current).toEqual({ symbol: 'ETH', decimals: 18 });

      // Same values but new object reference - should not cause re-renders
      rerender({
        nativeTokenMetadata: { symbol: 'ETH', decimals: 18 },
      });

      expect(renderCount).toBeLessThanOrEqual(initialRenderCount + 2);
    });
  });

  describe('Cached Token Metadata', () => {
    it('should return token metadata from state when available', () => {
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
    });

    it('should handle case-insensitive token addresses', () => {
      const { result } = renderTokenMetadata('0xTokenAddress', {
        tokensByChain: createTokensByChain(CHAIN_ID, {
          '0xtokenaddress': { symbol: 'USDC', decimals: 6, name: 'USD Coin' },
        }),
      });

      expect(result.current).toEqual({
        symbol: 'USDC',
        decimals: 6,
      });
    });

    it('should handle missing symbol in cached data', () => {
      const { result } = renderTokenMetadata('0xTokenAddress', {
        tokensByChain: createTokensByChain(CHAIN_ID, {
          '0xTokenAddress': { decimals: 18 },
        }),
      });

      expect(result.current).toEqual({
        symbol: 'Unknown Token',
        decimals: 18,
      });
    });
  });

  describe('API Token Metadata', () => {
    it('should fetch metadata from API when not in cache', async () => {
      const tokenAddress = '0xApiToken';
      mockFetchAssetMetadata.mockResolvedValue({
        symbol: 'API_TOKEN',
        decimals: 18,
        address: tokenAddress,
        chainId: CHAIN_ID,
      });

      const { result } = renderTokenMetadata(tokenAddress);

      // Initially shows unknown token
      expect(result.current).toEqual(UNKNOWN_TOKEN);

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
      expect(mockGetTokenStandardAndDetailsByChain).not.toHaveBeenCalled();
    });

    it('should handle API returning undefined', async () => {
      mockOnChainResponse('cUSDC', '6', 'Compound USD Coin');

      const { result } = renderTokenMetadata('0xNewTokenAddress');

      await waitFor(() => {
        expect(result.current).toEqual({
          symbol: 'cUSDC',
          decimals: 6,
        });
      });

      expect(mockGetTokenStandardAndDetailsByChain).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockFetchAssetMetadata.mockRejectedValue(new Error('API error'));
      mockOnChainResponse('FALLBACK', '18', 'Fallback Token');

      const { result } = renderTokenMetadata('0xFailingTokenAddress');

      await waitFor(() => {
        expect(result.current).toEqual({
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
    it('should handle on-chain fetch errors', async () => {
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
    });

    it('should handle null response from on-chain', async () => {
      mockGetTokenStandardAndDetailsByChain.mockResolvedValue(
        null as unknown as TokenStandAndDetails,
      );

      const { result } = renderTokenMetadata('0xNonExistentToken');

      await waitFor(() =>
        expect(mockGetTokenStandardAndDetailsByChain).toHaveBeenCalled(),
      );

      expect(result.current).toEqual(UNKNOWN_TOKEN);
    });
  });

  describe('Decimals Parsing', () => {
    const decimalTestCases = [
      {
        description: 'undefined decimals',
        decimals: undefined,
        expected: null,
      },
      {
        description: 'zero decimals as string',
        decimals: '0',
        expected: 0,
      },
      {
        description: 'zero decimals as number',
        decimals: 0,
        expected: 0,
      },
      {
        description: 'normal decimals as string',
        decimals: '18',
        expected: 18,
      },
      {
        description: 'empty string decimals',
        decimals: '',
        expected: null,
      },
    ];

    it.each(decimalTestCases)(
      'should handle $description',
      async ({ decimals, expected }) => {
        mockGetTokenStandardAndDetailsByChain.mockResolvedValue({
          symbol: 'TEST',
          decimals,
          name: 'Test Token',
          standard: 'ERC20',
        } as TokenStandAndDetails);

        const { result } = renderTokenMetadata('0xTestToken');

        await waitFor(() => {
          expect(result.current).toEqual({
            symbol: 'TEST',
            decimals: expected,
          });
        });
      },
    );
  });

  describe('Dynamic Updates', () => {
    it('should update when tokenAddress changes', async () => {
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
    });

    it('should update when chainId changes', async () => {
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

      const { result, rerender } = renderHook(
        ({ chainId }) =>
          useTokenMetadata(
            '0xUSDC',
            chainId,
            tokensByChain,
            MOCK_NATIVE_TOKEN,
          ),
        { initialProps: { chainId: CHAIN_ID } },
      );

      expect(result.current.symbol).toBe('USDC-ETH');

      rerender({ chainId: '0x89' });

      await waitFor(() => expect(result.current.symbol).toBe('USDC-POLY'));
    });
  });

  describe('Component Lifecycle', () => {
    it('should not update state after unmounting', async () => {
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(jest.fn());
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(jest.fn());

      // Delay API response
      mockFetchAssetMetadata.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined), 50)),
      );

      // Delay on-chain response
      mockGetTokenStandardAndDetailsByChain.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  symbol: 'SLOW',
                  decimals: '18',
                  name: 'Slow Token',
                  standard: 'ERC20',
                } as TokenStandAndDetails),
              100,
            ),
          ),
      );

      const { unmount } = renderTokenMetadata('0xSlowToken');

      // Unmount before async operations complete
      unmount();

      // Wait for operations to complete
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should not have warnings about setting state on unmounted component
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('unmounted component'),
      );

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});