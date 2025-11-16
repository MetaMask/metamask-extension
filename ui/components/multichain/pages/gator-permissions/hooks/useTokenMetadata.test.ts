import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import log from 'loglevel';
import * as actions from '../../../../../store/actions';
import { useTokenMetadata } from './useTokenMetadata';

jest.mock('../../../../../store/actions', () => ({
  getTokenStandardAndDetails: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(() => ({ address: '0xUserAddress' })),
}));

jest.mock('loglevel', () => ({
  error: jest.fn(),
}));

describe('useTokenMetadata', () => {
  const mockGetTokenStandardAndDetails =
    actions.getTokenStandardAndDetails as jest.MockedFunction<
      typeof actions.getTokenStandardAndDetails
    >;

  const mockNativeTokenMetadata = {
    symbol: 'ETH',
    decimals: 18,
    name: 'Ethereum',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return native token metadata when tokenAddress is undefined', () => {
    const { result } = renderHook(() =>
      useTokenMetadata(undefined, '0x1', {}, mockNativeTokenMetadata),
    );

    expect(result.current).toEqual(mockNativeTokenMetadata);
  });

  it('should return token metadata from state when available', () => {
    const mockTokensByChain = {
      '0x1': {
        data: {
          '0xTokenAddress': {
            symbol: 'DAI',
            decimals: 18,
            name: 'Dai Stablecoin',
          },
        },
      },
    };

    const { result } = renderHook(() =>
      useTokenMetadata(
        '0xTokenAddress',
        '0x1',
        mockTokensByChain,
        mockNativeTokenMetadata,
      ),
    );

    expect(result.current).toEqual({
      symbol: 'DAI',
      decimals: 18,
      name: 'Dai Stablecoin',
    });
    expect(mockGetTokenStandardAndDetails).not.toHaveBeenCalled();
  });

  it('should handle lowercase token addresses', () => {
    const mockTokensByChain = {
      '0x1': {
        data: {
          '0xtokenaddress': {
            symbol: 'USDC',
            decimals: 6,
            name: 'USD Coin',
          },
        },
      },
    };

    const { result } = renderHook(() =>
      useTokenMetadata(
        '0xTokenAddress',
        '0x1',
        mockTokensByChain,
        mockNativeTokenMetadata,
      ),
    );

    expect(result.current).toEqual({
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
    });
  });

  it('should fetch token metadata from backend when not in state', async () => {
    const mockTokensByChain = {
      '0x1': {
        data: {},
      },
    };

    mockGetTokenStandardAndDetails.mockResolvedValue({
      symbol: 'cUSDC',
      decimals: 6,
      name: 'Compound USD Coin',
      standard: 'ERC20',
      address: '0xNewTokenAddress',
    } as any);

    const { result } = renderHook(() =>
      useTokenMetadata(
        '0xNewTokenAddress',
        '0x1',
        mockTokensByChain,
        mockNativeTokenMetadata,
      ),
    );

    // Initial state should be "Unknown Token"
    expect(result.current).toEqual({
      symbol: 'Unknown Token',
      decimals: null,
      name: 'Unknown Token',
    });

    // Wait for the async fetch to complete
    await waitFor(() => {
      expect(result.current).toEqual({
        symbol: 'cUSDC',
        decimals: 6,
        name: 'Compound USD Coin',
      });
    });

    expect(mockGetTokenStandardAndDetails).toHaveBeenCalledWith(
      '0xNewTokenAddress',
      '0xUserAddress',
    );
  });

  it('should handle fetch errors gracefully', async () => {
    const mockTokensByChain = {
      '0x1': {
        data: {},
      },
    };

    mockGetTokenStandardAndDetails.mockRejectedValue(
      new Error('Network error'),
    );

    const { result } = renderHook(() =>
      useTokenMetadata(
        '0xFailingTokenAddress',
        '0x1',
        mockTokensByChain,
        mockNativeTokenMetadata,
      ),
    );

    // Should stay in unknown state after error
    await waitFor(() => {
      expect(mockGetTokenStandardAndDetails).toHaveBeenCalled();
    });

    expect(result.current).toEqual({
      symbol: 'Unknown Token',
      decimals: null,
      name: 'Unknown Token',
    });

    expect(log.error).toHaveBeenCalledWith('Failed to fetch token metadata', {
      tokenAddress: '0xFailingTokenAddress',
      chainId: '0x1',
      selectedAccountAddress: '0xUserAddress',
      error: 'Network error',
    });
  });

  it('should use default values for missing metadata fields', () => {
    const mockTokensByChain = {
      '0x1': {
        data: {
          '0xTokenAddress': {
            // Missing symbol and name
            decimals: 18,
          },
        },
      },
    };

    const { result } = renderHook(() =>
      useTokenMetadata(
        '0xTokenAddress',
        '0x1',
        mockTokensByChain,
        mockNativeTokenMetadata,
      ),
    );

    expect(result.current).toEqual({
      symbol: 'Unknown Token',
      decimals: 18,
      name: 'Unknown Token',
    });
  });

  it('should update when tokenAddress changes', async () => {
    const mockTokensByChain = {
      '0x1': {
        data: {
          '0xToken1': {
            symbol: 'TKN1',
            decimals: 18,
            name: 'Token 1',
          },
        },
      },
    };

    const { result, rerender } = renderHook(
      ({ tokenAddress }) =>
        useTokenMetadata(
          tokenAddress,
          '0x1',
          mockTokensByChain,
          mockNativeTokenMetadata,
        ),
      {
        initialProps: { tokenAddress: '0xToken1' },
      },
    );

    expect(result.current.symbol).toBe('TKN1');

    // Fetch for new token not in state
    mockGetTokenStandardAndDetails.mockResolvedValue({
      symbol: 'TKN2',
      decimals: 6,
      name: 'Token 2',
      standard: 'ERC20',
      address: '0xToken2',
    } as any);

    rerender({ tokenAddress: '0xToken2' });

    await waitFor(() => {
      expect(result.current.symbol).toBe('TKN2');
    });
  });

  it('should handle null decimals from backend', async () => {
    const mockTokensByChain = {
      '0x1': {
        data: {},
      },
    };

    mockGetTokenStandardAndDetails.mockResolvedValue({
      symbol: 'WEIRD',
      decimals: undefined,
      name: 'Weird Token',
      standard: 'ERC20',
      address: '0xWeirdToken',
    } as any);

    const { result } = renderHook(() =>
      useTokenMetadata(
        '0xWeirdToken',
        '0x1',
        mockTokensByChain,
        mockNativeTokenMetadata,
      ),
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        symbol: 'WEIRD',
        decimals: null,
        name: 'Weird Token',
      });
    });
  });

  // Test #6: Missing Edge Case - decimals: 0
  it('should handle tokens with 0 decimals correctly', async () => {
    const mockTokensByChain = {
      '0x1': {
        data: {},
      },
    };

    mockGetTokenStandardAndDetails.mockResolvedValue({
      symbol: 'NFT',
      decimals: '0',
      name: 'NFT Token',
      standard: 'ERC20',
      address: '0xNFTToken',
    } as any);

    const { result } = renderHook(() =>
      useTokenMetadata(
        '0xNFTToken',
        '0x1',
        mockTokensByChain,
        mockNativeTokenMetadata,
      ),
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        symbol: 'NFT',
        decimals: 0,
        name: 'NFT Token',
      });
    });
  });

  // Test #7: Missing Test - Empty String Address
  it('should return native token metadata when tokenAddress is empty string', () => {
    const { result } = renderHook(() =>
      useTokenMetadata('', '0x1', {}, mockNativeTokenMetadata),
    );

    expect(result.current).toEqual(mockNativeTokenMetadata);
  });

  // Test #8: Missing Test - Chain ID Changes
  it('should update when chainId changes', async () => {
    // Start with token data on chain 0x1 only
    let mockTokensByChain = {
      '0x1': {
        data: {
          '0xusdc': {
            symbol: 'USDC-ETH',
            decimals: 6,
            name: 'USD Coin on Ethereum',
          },
        },
      },
    };

    const { result, rerender } = renderHook(
      ({ chainId, tokensByChain }) =>
        useTokenMetadata(
          '0xUSDC',
          chainId,
          tokensByChain,
          mockNativeTokenMetadata,
        ),
      {
        initialProps: { chainId: '0x1', tokensByChain: mockTokensByChain },
      },
    );

    expect(result.current.symbol).toBe('USDC-ETH');
    expect(result.current.name).toBe('USD Coin on Ethereum');

    // Now add chain 0x89 data and switch to it
    mockTokensByChain = {
      ...mockTokensByChain,
      '0x89': {
        data: {
          '0xusdc': {
            symbol: 'USDC-POLY',
            decimals: 6,
            name: 'USD Coin on Polygon',
          },
        },
      },
    };

    rerender({ chainId: '0x89', tokensByChain: mockTokensByChain });

    await waitFor(() => {
      expect(result.current.symbol).toBe('USDC-POLY');
      expect(result.current.name).toBe('USD Coin on Polygon');
    });
  });

  // Test #9: Missing Test - Cleanup on Unmount
  it('should not update state if unmounted during fetch', async () => {
    const mockTokensByChain = {
      '0x1': {
        data: {},
      },
    };

    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockGetTokenStandardAndDetails.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                symbol: 'SLOW',
                decimals: '18',
                name: 'Slow Token',
                standard: 'ERC20',
                address: '0xSlowToken',
              }),
            100,
          ),
        ),
    );

    const { unmount } = renderHook(() =>
      useTokenMetadata(
        '0xSlowToken',
        '0x1',
        mockTokensByChain,
        mockNativeTokenMetadata,
      ),
    );

    // Unmount before fetch completes
    unmount();

    // Wait for fetch to complete
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Should not have any warnings about state updates
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('unmounted component'),
    );

    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  // Test #10: Missing Test - Null API Response
  it('should handle null response from backend gracefully', async () => {
    const mockTokensByChain = {
      '0x1': {
        data: {},
      },
    };

    mockGetTokenStandardAndDetails.mockResolvedValue(null as any);

    const { result } = renderHook(() =>
      useTokenMetadata(
        '0xNonExistentToken',
        '0x1',
        mockTokensByChain,
        mockNativeTokenMetadata,
      ),
    );

    await waitFor(() => {
      expect(mockGetTokenStandardAndDetails).toHaveBeenCalled();
    });

    expect(result.current).toEqual({
      symbol: 'Unknown Token',
      decimals: null,
      name: 'Unknown Token',
    });
  });
});
