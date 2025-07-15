import { renderHook, act } from '@testing-library/react-hooks';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { useBridgeQueryParams } from './useBridgeQueryParams';
import { fetchMultipleAssetMetadata } from '../../../../shared/lib/asset-utils';
import { BridgeQueryParams } from '../../../../shared/lib/deep-links/routes/swap';
import { CaipAssetTypeStruct } from '@metamask/utils';
import { formatChainIdToCaip } from '@metamask/bridge-controller';

// Mock dependencies
jest.mock('react-redux');
jest.mock('react-router-dom');
jest.mock('../../../../shared/lib/asset-utils');
jest.mock('@metamask/bridge-controller', () => ({
  formatChainIdToCaip: jest.fn(),
}));

const mockDispatch = jest.fn();
const mockHistory = {
  replace: jest.fn(),
};
const mockLocation = {
  search: '',
  pathname: '/',
  hash: '',
  state: undefined,
  key: 'test',
};

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
const mockUseHistory = useHistory as jest.MockedFunction<typeof useHistory>;
const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;
const mockFetchMultipleAssetMetadata =
  fetchMultipleAssetMetadata as jest.MockedFunction<
    typeof fetchMultipleAssetMetadata
  >;
const mockFormatChainIdToCaip = formatChainIdToCaip as jest.MockedFunction<
  typeof formatChainIdToCaip
>;

describe('useBridgeQueryParams', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseDispatch.mockReturnValue(mockDispatch);
    mockUseHistory.mockReturnValue(mockHistory);
    mockUseLocation.mockReturnValue(mockLocation);
    mockFormatChainIdToCaip.mockImplementation(
      (chainId) => `eip155:${chainId}`,
    );
  });

  const setupMockState = (overrides = {}) => {
    const defaultState = {
      fromChains: [
        { chainId: '0x1', name: 'Ethereum Mainnet' },
        { chainId: '0xa', name: 'Optimism' },
      ],
      fromChain: null,
      toChains: [
        { chainId: '0xa', name: 'Optimism' },
        { chainId: '0x89', name: 'Polygon' },
      ],
      fromToken: null,
      fromTokens: {},
    };

    mockUseSelector.mockImplementation((selector) => {
      // Mock selector implementations
      if (selector.name === 'getFromChains') return defaultState.fromChains;
      if (selector.name === 'getFromChain') return defaultState.fromChain;
      if (selector.name === 'getToChains') return defaultState.toChains;
      if (selector.name === 'getFromToken') return defaultState.fromToken;
      if (selector.name === 'getTokenList') return defaultState.fromTokens;

      return { ...defaultState, ...overrides };
    });
  };

  it('should parse query parameters correctly', () => {
    const mockSearch =
      '?from=eip155:1%2Ferc20%3A0xa0b86a33e6441b8c4&to=eip155:10%2Ferc20%3A0x4200000000000000000000000000000000000042&amount=1000000000000000000';
    mockUseLocation.mockReturnValue({ ...mockLocation, search: mockSearch });

    setupMockState();

    const { result } = renderHook(() => useBridgeQueryParams());

    // Hook no longer returns state, just verify it doesn't crash
    expect(result.current).toBeUndefined();
  });

  it('should handle invalid CAIP asset IDs gracefully', () => {
    const mockSearch = '?from=invalid-asset-id';
    mockUseLocation.mockReturnValue({ search: mockSearch });

    setupMockState();

    const { result } = renderHook(() => useBridgeQueryParams());

    // Hook no longer returns state, just verify it doesn't crash
    expect(result.current).toBeUndefined();
  });

  it('should set from chain when different from current', async () => {
    const mockSearch = '?from=eip155:1%2Ferc20%3A0xa0b86a33e6441b8c4';
    mockUseLocation.mockReturnValue({ search: mockSearch });

    setupMockState({
      fromChain: { chainId: '0xa' }, // Different chain
    });

    const { result } = renderHook(() => useBridgeQueryParams());

    await act(async () => {
      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('setFromChain'),
      }),
    );
  });

  it('should fetch and set from token metadata', async () => {
    const mockSearch = '?from=eip155:1%2Ferc20%3A0xa0b86a33e6441b8c4';
    mockUseLocation.mockReturnValue({ search: mockSearch });

    const mockTokenMetadata = {
      assetId: 'eip155:1/erc20:0xa0b86a33e6441b8c4',
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
    };

    mockFetchMultipleAssetMetadata.mockResolvedValue({
      'eip155:1/erc20:0xa0b86a33e6441b8c4': mockTokenMetadata,
    });

    setupMockState({
      fromChain: { chainId: '0x1' }, // Same chain
    });

    const { result } = renderHook(() => useBridgeQueryParams());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockFetchMultipleAssetMetadata).toHaveBeenCalledWith([
      'eip155:1/erc20:0xa0b86a33e6441b8c4',
    ]);

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('setFromToken'),
        payload: expect.objectContaining({
          symbol: 'USDC',
          decimals: 6,
        }),
      }),
    );
  });

  it('should set amount when from token is available', async () => {
    const mockSearch =
      '?from=eip155:1%2Ferc20%3A0xa0b86a33e6441b8c4&amount=1000000';
    mockUseLocation.mockReturnValue({ search: mockSearch });

    const mockTokenMetadata = {
      assetId: 'eip155:1/erc20:0xa0b86a33e6441b8c4',
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
    };

    mockFetchMultipleAssetMetadata.mockResolvedValue({
      'eip155:1/erc20:0xa0b86a33e6441b8c4': mockTokenMetadata,
    });

    setupMockState({
      fromChain: { chainId: '0x1' },
      fromToken: mockTokenMetadata,
    });

    const { result } = renderHook(() => useBridgeQueryParams());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('setFromTokenInputValue'),
        payload: '1',
      }),
    );
  });

  it('should clean up URL parameters after processing', async () => {
    const mockSearch =
      '?from=eip155:1%2Ferc20%3A0xa0b86a33e6441b8c4&amount=1000000';
    mockUseLocation.mockReturnValue({ search: mockSearch });

    const mockTokenMetadata = {
      assetId: 'eip155:1/erc20:0xa0b86a33e6441b8c4',
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
    };

    mockFetchMultipleAssetMetadata.mockResolvedValue({
      'eip155:1/erc20:0xa0b86a33e6441b8c4': mockTokenMetadata,
    });

    setupMockState({
      fromChain: { chainId: '0x1' },
      fromToken: mockTokenMetadata,
    });

    const { result } = renderHook(() => useBridgeQueryParams());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Should clean up FROM parameter first, then AMOUNT parameter
    expect(mockHistory.replace).toHaveBeenCalledTimes(2);
    expect(mockHistory.replace).toHaveBeenNthCalledWith(1, {
      search: 'amount=1000000',
    });
    expect(mockHistory.replace).toHaveBeenNthCalledWith(2, {
      search: '',
    });
  });

  it('should handle errors gracefully', async () => {
    const mockSearch = '?from=eip155:1%2Ferc20%3A0xa0b86a33e6441b8c4';
    mockUseLocation.mockReturnValue({ search: mockSearch });

    mockFetchMultipleAssetMetadata.mockRejectedValue(
      new Error('Network error'),
    );

    setupMockState({
      fromChain: { chainId: '0x1' },
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useBridgeQueryParams());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch from token metadata:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it('should not process when no query parameters are present', () => {
    mockUseLocation.mockReturnValue({ search: '' });

    setupMockState();

    const { result } = renderHook(() => useBridgeQueryParams());

    // Hook no longer returns state, just verify it doesn't crash
    expect(result.current).toBeUndefined();
  });
});
