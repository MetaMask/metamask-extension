import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import log from 'loglevel';
import * as actions from '../../../../../store/actions';
import type { TokenStandAndDetails } from '../../../../../store/actions';
import { useTokenMetadata } from './useTokenMetadata';

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

  const mockNativeTokenMetadata = {
    symbol: 'ETH',
    decimals: 18,
    name: 'Ethereum',
  };

  const UNKNOWN_TOKEN = {
    symbol: 'Unknown Token',
    decimals: null,
    name: 'Unknown Token',
  };

  const CHAIN_ID = '0x1';
  const EMPTY_TOKENS_BY_CHAIN = { [CHAIN_ID]: { data: {} } };

  type TokensByChain = Record<
    string,
    {
      data: Record<
        string,
        { symbol?: string; decimals?: number; name?: string }
      >;
    }
  >;
  type TokenMetadata = {
    symbol: string;
    decimals: number | null;
    name: string;
  };

  const renderTokenMetadata = (
    tokenAddress?: string,
    options?: Partial<{
      chainId: string;
      tokensByChain: TokensByChain;
      nativeTokenMetadata: TokenMetadata;
    }>,
  ) =>
    renderHook(() =>
      useTokenMetadata(
        tokenAddress,
        options?.chainId || CHAIN_ID,
        options?.tokensByChain || EMPTY_TOKENS_BY_CHAIN,
        options?.nativeTokenMetadata || mockNativeTokenMetadata,
      ),
    );

  const createTokensByChain = (
    chainId: string,
    tokens: Record<
      string,
      { symbol?: string; decimals?: number; name?: string }
    >,
  ): TokensByChain => ({ [chainId]: { data: tokens } });

  const mockOnChain = (
    symbol: string,
    decimals: string | number,
    name: string,
  ) => {
    mockGetTokenStandardAndDetailsByChain.mockResolvedValue({
      symbol,
      decimals: typeof decimals === 'number' ? decimals.toString() : decimals,
      name,
      standard: 'ERC20',
    } as TokenStandAndDetails);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchAssetMetadata.mockResolvedValue(undefined);
  });

  it('should return native token metadata when tokenAddress is undefined or empty', () => {
    expect(renderTokenMetadata(undefined).result.current).toEqual(
      mockNativeTokenMetadata,
    );
    expect(renderTokenMetadata('').result.current).toEqual(
      mockNativeTokenMetadata,
    );
  });

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
      name: 'Dai Stablecoin',
    });
    expect(mockFetchAssetMetadata).not.toHaveBeenCalled();
    expect(mockGetTokenStandardAndDetailsByChain).not.toHaveBeenCalled();
  });

  it('should handle lowercase token addresses and missing fields', () => {
    const { result: result1 } = renderTokenMetadata('0xTokenAddress', {
      tokensByChain: createTokensByChain(CHAIN_ID, {
        '0xtokenaddress': { symbol: 'USDC', decimals: 6, name: 'USD Coin' },
      }),
    });
    expect(result1.current).toEqual({
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
    });

    const { result: result2 } = renderTokenMetadata('0xTokenAddress', {
      tokensByChain: createTokensByChain(CHAIN_ID, {
        '0xTokenAddress': { decimals: 18 },
      }),
    });
    expect(result2.current).toEqual({
      symbol: 'Unknown Token',
      decimals: 18,
      name: 'Unknown Token',
    });
  });

  it('should use API metadata when available', async () => {
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
        name: 'API_TOKEN',
      });
    });

    expect(mockFetchAssetMetadata).toHaveBeenCalledWith(
      tokenAddress,
      CHAIN_ID,
      undefined,
    );
    expect(mockGetTokenStandardAndDetailsByChain).not.toHaveBeenCalled();
  });

  it('should fall back to on-chain when API returns undefined', async () => {
    mockOnChain('cUSDC', '6', 'Compound USD Coin');

    const { result } = renderTokenMetadata('0xNewTokenAddress');
    expect(result.current).toEqual(UNKNOWN_TOKEN);

    await waitFor(() => {
      expect(result.current).toEqual({
        symbol: 'cUSDC',
        decimals: 6,
        name: 'Compound USD Coin',
      });
    });
  });

  it('should handle API errors and fall back to on-chain', async () => {
    mockFetchAssetMetadata.mockRejectedValue(new Error('API error'));
    mockOnChain('FALLBACK', '18', 'Fallback Token');

    const { result } = renderTokenMetadata('0xFailingTokenAddress');

    await waitFor(() => {
      expect(result.current).toEqual({
        symbol: 'FALLBACK',
        decimals: 18,
        name: 'Fallback Token',
      });
    });

    expect(log.debug).toHaveBeenCalledWith(
      'Token API fetch failed, falling back to on-chain',
      expect.objectContaining({
        tokenAddress: '0xFailingTokenAddress',
        chainId: CHAIN_ID,
      }),
    );
  });

  it('should handle both API and on-chain errors gracefully', async () => {
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

  it('should update when tokenAddress changes', async () => {
    const { result, rerender } = renderHook(
      ({ tokenAddress }) =>
        useTokenMetadata(
          tokenAddress,
          CHAIN_ID,
          createTokensByChain(CHAIN_ID, {
            '0xToken1': { symbol: 'TKN1', decimals: 18, name: 'Token 1' },
          }),
          mockNativeTokenMetadata,
        ),
      { initialProps: { tokenAddress: '0xToken1' } },
    );

    expect(result.current.symbol).toBe('TKN1');

    mockOnChain('TKN2', '6', 'Token 2');
    rerender({ tokenAddress: '0xToken2' });

    await waitFor(() => expect(result.current.symbol).toBe('TKN2'));
  });

  it('should handle edge cases for decimals (null, 0, undefined)', async () => {
    const testCases = [
      {
        decimals: undefined,
        expected: null,
        symbol: 'WEIRD',
        name: 'Weird Token',
      },
      { decimals: '0', expected: 0, symbol: 'NFT', name: 'NFT Token' },
    ];

    for (const { decimals, expected, symbol, name } of testCases) {
      mockGetTokenStandardAndDetailsByChain.mockResolvedValue({
        symbol,
        decimals,
        name,
        standard: 'ERC20',
      } as TokenStandAndDetails);

      const { result } = renderTokenMetadata(`0x${symbol}Token`);

      await waitFor(() => {
        expect(result.current).toEqual({ symbol, decimals: expected, name });
      });
    }
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
          mockNativeTokenMetadata,
        ),
      { initialProps: { chainId: CHAIN_ID } },
    );

    expect(result.current.symbol).toBe('USDC-ETH');
    rerender({ chainId: '0x89' });
    await waitFor(() => expect(result.current.symbol).toBe('USDC-POLY'));
  });

  it('should handle null response from on-chain gracefully', async () => {
    mockGetTokenStandardAndDetailsByChain.mockResolvedValue(
      null as unknown as TokenStandAndDetails,
    );

    const { result } = renderTokenMetadata('0xNonExistentToken');

    await waitFor(() =>
      expect(mockGetTokenStandardAndDetailsByChain).toHaveBeenCalled(),
    );
    expect(result.current).toEqual(UNKNOWN_TOKEN);
  });

  it('should not update state if unmounted during fetch', async () => {
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(jest.fn());
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(jest.fn());

    mockFetchAssetMetadata.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined), 50)),
    );
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
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('unmounted component'),
    );

    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should prevent infinite loops when nativeTokenMetadata is a new object reference each render', () => {
    let renderCount = 0;
    const { result, rerender } = renderHook(
      ({ nativeTokenMetadata }) => {
        renderCount += 1;
        return useTokenMetadata(undefined, CHAIN_ID, {}, nativeTokenMetadata);
      },
      {
        initialProps: {
          nativeTokenMetadata: {
            symbol: 'ETH',
            decimals: 18,
            name: 'Ethereum',
          },
        },
      },
    );

    const initialRenderCount = renderCount;
    expect(result.current).toEqual({
      symbol: 'ETH',
      decimals: 18,
      name: 'Ethereum',
    });

    rerender({
      nativeTokenMetadata: { symbol: 'ETH', decimals: 18, name: 'Ethereum' },
    });
    expect(renderCount).toBeLessThanOrEqual(initialRenderCount + 2);

    rerender({
      nativeTokenMetadata: { symbol: 'MATIC', decimals: 18, name: 'Polygon' },
    });
    expect(result.current).toEqual({
      symbol: 'MATIC',
      decimals: 18,
      name: 'Polygon',
    });
  });
});
