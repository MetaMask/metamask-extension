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

  // Helper to create tokensByChain with token data
  const createTokensByChain = (
    chainId: string,
    tokens: Record<
      string,
      { symbol?: string; decimals?: number; name?: string }
    >,
  ) => ({
    [chainId]: { data: tokens },
  });

  // Helper to create on-chain token details
  const createOnChainDetails = (
    symbol: string,
    decimals: string | number,
    name: string,
  ): TokenStandAndDetails =>
    ({
      symbol,
      decimals: typeof decimals === 'number' ? decimals.toString() : decimals,
      name,
      standard: 'ERC20',
    }) as TokenStandAndDetails;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchAssetMetadata.mockResolvedValue(undefined);
  });

  it('should return native token metadata when tokenAddress is undefined or empty', () => {
    const { result: result1 } = renderHook(() =>
      useTokenMetadata(undefined, CHAIN_ID, {}, mockNativeTokenMetadata),
    );
    expect(result1.current).toEqual(mockNativeTokenMetadata);

    const { result: result2 } = renderHook(() =>
      useTokenMetadata('', CHAIN_ID, {}, mockNativeTokenMetadata),
    );
    expect(result2.current).toEqual(mockNativeTokenMetadata);
  });

  it('should return token metadata from state when available', () => {
    const tokensByChain = createTokensByChain(CHAIN_ID, {
      '0xTokenAddress': {
        symbol: 'DAI',
        decimals: 18,
        name: 'Dai Stablecoin',
      },
    });

    const { result } = renderHook(() =>
      useTokenMetadata(
        '0xTokenAddress',
        CHAIN_ID,
        tokensByChain,
        mockNativeTokenMetadata,
      ),
    );

    expect(result.current).toEqual({
      symbol: 'DAI',
      decimals: 18,
      name: 'Dai Stablecoin',
    });
    expect(mockFetchAssetMetadata).not.toHaveBeenCalled();
    expect(mockGetTokenStandardAndDetailsByChain).not.toHaveBeenCalled();
  });

  it('should handle lowercase token addresses and missing fields', () => {
    const tokensByChain1 = createTokensByChain(CHAIN_ID, {
      '0xtokenaddress': {
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
      },
    });

    const { result: result1 } = renderHook(() =>
      useTokenMetadata(
        '0xTokenAddress',
        CHAIN_ID,
        tokensByChain1,
        mockNativeTokenMetadata,
      ),
    );
    expect(result1.current).toEqual({
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
    });

    // Test missing symbol and name
    const tokensByChain2 = createTokensByChain(CHAIN_ID, {
      '0xTokenAddress': { decimals: 18 },
    });

    const { result: result2 } = renderHook(() =>
      useTokenMetadata(
        '0xTokenAddress',
        CHAIN_ID,
        tokensByChain2,
        mockNativeTokenMetadata,
      ),
    );
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
      assetId: 'eip155:1/erc20:0xapitoken',
    });

    const { result } = renderHook(() =>
      useTokenMetadata(
        tokenAddress,
        CHAIN_ID,
        EMPTY_TOKENS_BY_CHAIN,
        mockNativeTokenMetadata,
      ),
    );

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
    const tokenAddress = '0xNewTokenAddress';
    mockFetchAssetMetadata.mockResolvedValue(undefined);
    mockGetTokenStandardAndDetailsByChain.mockResolvedValue(
      createOnChainDetails('cUSDC', '6', 'Compound USD Coin'),
    );

    const { result } = renderHook(() =>
      useTokenMetadata(
        tokenAddress,
        CHAIN_ID,
        EMPTY_TOKENS_BY_CHAIN,
        mockNativeTokenMetadata,
      ),
    );

    expect(result.current).toEqual(UNKNOWN_TOKEN);

    await waitFor(() => {
      expect(result.current).toEqual({
        symbol: 'cUSDC',
        decimals: 6,
        name: 'Compound USD Coin',
      });
    });

    expect(mockFetchAssetMetadata).toHaveBeenCalledWith(
      tokenAddress,
      CHAIN_ID,
      undefined,
    );
    expect(mockGetTokenStandardAndDetailsByChain).toHaveBeenCalledWith(
      tokenAddress,
      '0xUserAddress',
      undefined,
      CHAIN_ID,
    );
  });

  it('should handle API errors and fall back to on-chain', async () => {
    const tokenAddress = '0xFailingTokenAddress';
    mockFetchAssetMetadata.mockRejectedValue(new Error('API error'));
    mockGetTokenStandardAndDetailsByChain.mockResolvedValue(
      createOnChainDetails('FALLBACK', '18', 'Fallback Token'),
    );

    const { result } = renderHook(() =>
      useTokenMetadata(
        tokenAddress,
        CHAIN_ID,
        EMPTY_TOKENS_BY_CHAIN,
        mockNativeTokenMetadata,
      ),
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        symbol: 'FALLBACK',
        decimals: 18,
        name: 'Fallback Token',
      });
    });

    expect(mockFetchAssetMetadata).toHaveBeenCalled();
    expect(log.debug).toHaveBeenCalledWith(
      'Token API fetch failed, falling back to on-chain',
      expect.objectContaining({ tokenAddress, chainId: CHAIN_ID }),
    );
    expect(mockGetTokenStandardAndDetailsByChain).toHaveBeenCalled();
  });

  it('should handle both API and on-chain errors gracefully', async () => {
    const tokenAddress = '0xFailingTokenAddress';
    mockFetchAssetMetadata.mockRejectedValue(new Error('API error'));
    mockGetTokenStandardAndDetailsByChain.mockRejectedValue(
      new Error('On-chain error'),
    );

    const { result } = renderHook(() =>
      useTokenMetadata(
        tokenAddress,
        CHAIN_ID,
        EMPTY_TOKENS_BY_CHAIN,
        mockNativeTokenMetadata,
      ),
    );

    await waitFor(() => {
      expect(mockGetTokenStandardAndDetailsByChain).toHaveBeenCalled();
    });

    expect(result.current).toEqual(UNKNOWN_TOKEN);
    expect(log.debug).toHaveBeenCalledWith(
      'Token API fetch failed, falling back to on-chain',
      expect.objectContaining({ tokenAddress, chainId: CHAIN_ID }),
    );
    expect(log.error).toHaveBeenCalledWith(
      'Failed to fetch token metadata from on-chain',
      {
        tokenAddress,
        chainId: CHAIN_ID,
        selectedAccountAddress: '0xUserAddress',
        error: 'On-chain error',
      },
    );
  });

  it('should update when tokenAddress changes', async () => {
    const tokensByChain = createTokensByChain(CHAIN_ID, {
      '0xToken1': { symbol: 'TKN1', decimals: 18, name: 'Token 1' },
    });

    const { result, rerender } = renderHook(
      ({ tokenAddress }) =>
        useTokenMetadata(
          tokenAddress,
          CHAIN_ID,
          tokensByChain,
          mockNativeTokenMetadata,
        ),
      { initialProps: { tokenAddress: '0xToken1' } },
    );

    expect(result.current.symbol).toBe('TKN1');

    mockFetchAssetMetadata.mockResolvedValue(undefined);
    mockGetTokenStandardAndDetailsByChain.mockResolvedValue(
      createOnChainDetails('TKN2', '6', 'Token 2'),
    );

    rerender({ tokenAddress: '0xToken2' });

    await waitFor(() => {
      expect(result.current.symbol).toBe('TKN2');
    });
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
      mockFetchAssetMetadata.mockResolvedValue(undefined);
      mockGetTokenStandardAndDetailsByChain.mockResolvedValue({
        symbol,
        decimals,
        name,
        standard: 'ERC20',
      } as TokenStandAndDetails);

      const { result } = renderHook(() =>
        useTokenMetadata(
          `0x${symbol}Token`,
          CHAIN_ID,
          EMPTY_TOKENS_BY_CHAIN,
          mockNativeTokenMetadata,
        ),
      );

      await waitFor(() => {
        expect(result.current).toEqual({
          symbol,
          decimals: expected,
          name,
        });
      });
    }
  });

  it('should update when chainId changes', async () => {
    const tokenAddress = '0xUSDC';
    let tokensByChain = createTokensByChain(CHAIN_ID, {
      '0xusdc': {
        symbol: 'USDC-ETH',
        decimals: 6,
        name: 'USD Coin on Ethereum',
      },
    });

    const { result, rerender } = renderHook(
      ({ chainId, tokensByChain: tokens }) =>
        useTokenMetadata(
          tokenAddress,
          chainId,
          tokens,
          mockNativeTokenMetadata,
        ),
      { initialProps: { chainId: CHAIN_ID, tokensByChain } },
    );

    expect(result.current.symbol).toBe('USDC-ETH');

    tokensByChain = {
      ...tokensByChain,
      ...createTokensByChain('0x89', {
        '0xusdc': {
          symbol: 'USDC-POLY',
          decimals: 6,
          name: 'USD Coin on Polygon',
        },
      }),
    };

    rerender({ chainId: '0x89', tokensByChain });

    await waitFor(() => {
      expect(result.current.symbol).toBe('USDC-POLY');
    });
  });

  it('should handle null response from on-chain gracefully', async () => {
    mockFetchAssetMetadata.mockResolvedValue(undefined);
    mockGetTokenStandardAndDetailsByChain.mockResolvedValue(
      null as unknown as TokenStandAndDetails,
    );

    const { result } = renderHook(() =>
      useTokenMetadata(
        '0xNonExistentToken',
        CHAIN_ID,
        EMPTY_TOKENS_BY_CHAIN,
        mockNativeTokenMetadata,
      ),
    );

    await waitFor(() => {
      expect(mockGetTokenStandardAndDetailsByChain).toHaveBeenCalled();
    });

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
            () => resolve(createOnChainDetails('SLOW', '18', 'Slow Token')),
            100,
          ),
        ),
    );

    const { unmount } = renderHook(() =>
      useTokenMetadata(
        '0xSlowToken',
        CHAIN_ID,
        EMPTY_TOKENS_BY_CHAIN,
        mockNativeTokenMetadata,
      ),
    );

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
