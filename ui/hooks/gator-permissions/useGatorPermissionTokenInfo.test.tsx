import React from 'react';
import { Provider } from 'react-redux';
import { act, renderHook, waitFor } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type { Store } from 'redux';
import { Hex } from '@metamask/utils';
import { fetchAssetMetadata } from '../../../shared/lib/asset-utils';
import { getTokenStandardAndDetailsByChain } from '../../store/actions';
import { clearTokenInfoCaches } from '../../../shared/lib/gator-permissions/gator-permissions-utils';
import { useGatorPermissionTokenInfo } from './useGatorPermissionTokenInfo';

// Mock dependencies
jest.mock('../../../shared/lib/asset-utils');
jest.mock('../../store/actions');
jest.mock('loglevel', () => ({
  warn: jest.fn(),
  error: jest.fn(),
}));

const mockFetchAssetMetadata = fetchAssetMetadata as jest.MockedFunction<
  typeof fetchAssetMetadata
>;
const mockGetTokenStandardAndDetailsByChain =
  getTokenStandardAndDetailsByChain as jest.MockedFunction<
    typeof getTokenStandardAndDetailsByChain
  >;

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('useGatorPermissionTokenInfo', () => {
  const mockTokenAddress = '0x1234567890123456789012345678901234567890';
  const mockChainId = '0x1' as Hex;

  const createMockStore = (overrides = {}) => {
    return mockStore({
      metamask: {
        tokensChainsCache: {},
        allTokens: {},
        useExternalServices: true,
        networkConfigurationsByChainId: {},
        multichainNetworkConfigurationsByChainId: {
          'eip155:1': {
            chainId: '0x1',
            nativeCurrency: 'ETH',
            name: 'Ethereum Mainnet',
          },
          'eip155:137': {
            chainId: '0x89',
            nativeCurrency: 'MATIC',
            name: 'Polygon',
          },
        },
        internalAccounts: { accounts: {} },
        ...overrides,
      },
    });
  };

  const createWrapper = (testStore: Store) => {
    return ({ children }: { children: React.ReactNode }) => (
      <Provider store={testStore}>{children}</Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    clearTokenInfoCaches();
  });

  async function flushAsyncUpdates() {
    await act(async () => {
      await Promise.resolve();
    });
  }

  describe('native token handling', () => {
    it('should return native token info for native-token-stream permission type', async () => {
      const testStore = createMockStore();

      const { result } = renderHook(
        () =>
          useGatorPermissionTokenInfo(
            undefined,
            mockChainId,
            'native-token-stream',
          ),
        { wrapper: createWrapper(testStore) },
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.tokenInfo).toMatchObject({
        symbol: 'ETH',
        decimals: 18,
        chainId: mockChainId,
      });
      expect(mockFetchAssetMetadata).not.toHaveBeenCalled();
      await flushAsyncUpdates();
    });

    it('should return native token info for native-token-periodic permission type', async () => {
      const testStore = createMockStore();

      const { result } = renderHook(
        () =>
          useGatorPermissionTokenInfo(
            undefined,
            mockChainId,
            'native-token-periodic',
          ),
        { wrapper: createWrapper(testStore) },
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.tokenInfo).toMatchObject({
        symbol: 'ETH',
        decimals: 18,
        chainId: mockChainId,
      });
      await flushAsyncUpdates();
    });

    it('should fallback to CHAIN_ID_TO_CURRENCY_SYMBOL_MAP when network config is missing', async () => {
      const sepoliaChainId = '0xaa36a7' as Hex; // Sepolia
      const testStore = createMockStore({
        multichainNetworkConfigurationsByChainId: {},
      });

      const { result } = renderHook(
        () =>
          useGatorPermissionTokenInfo(
            undefined,
            sepoliaChainId,
            'native-token-stream',
          ),
        { wrapper: createWrapper(testStore) },
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.tokenInfo).toMatchObject({
        symbol: 'SepoliaETH',
        decimals: 18,
        chainId: sepoliaChainId,
      });
      await flushAsyncUpdates();
    });

    it('should default to ETH when neither network config nor CHAIN_ID_TO_CURRENCY_SYMBOL_MAP has the chain', async () => {
      const unknownChainId = '0x999999' as Hex;
      const testStore = createMockStore({
        multichainNetworkConfigurationsByChainId: {},
      });

      const { result } = renderHook(
        () =>
          useGatorPermissionTokenInfo(
            undefined,
            unknownChainId,
            'native-token-stream',
          ),
        { wrapper: createWrapper(testStore) },
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.tokenInfo).toMatchObject({
        symbol: 'ETH',
        decimals: 18,
        chainId: unknownChainId,
      });
      await flushAsyncUpdates();
    });
  });

  describe('cache layer', () => {
    it('should return cached token info immediately', async () => {
      const testStore = createMockStore({
        tokensChainsCache: {
          [mockChainId]: {
            data: {
              [mockTokenAddress.toLowerCase()]: {
                symbol: 'CACHED',
                decimals: 18,
                name: 'Cached Token',
                iconUrl: 'https://example.com/cached.png',
              },
            },
          },
        },
      });

      const { result } = renderHook(
        () => useGatorPermissionTokenInfo(mockTokenAddress, mockChainId),
        { wrapper: createWrapper(testStore) },
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.tokenInfo).toMatchObject({
        symbol: 'CACHED',
        decimals: 18,
        name: 'Cached Token',
        image: 'https://example.com/cached.png',
        address: mockTokenAddress,
        chainId: mockChainId,
      });
      expect(mockFetchAssetMetadata).not.toHaveBeenCalled();
      await flushAsyncUpdates();
    });

    it('should return imported token info', async () => {
      const testStore = createMockStore({
        allTokens: {
          [mockChainId]: {
            '0xUserAccount': [
              {
                address: mockTokenAddress,
                symbol: 'IMPORTED',
                decimals: 6,
                name: 'Imported Token',
                image: 'https://example.com/imported.png',
              },
            ],
          },
        },
      });

      const { result } = renderHook(
        () => useGatorPermissionTokenInfo(mockTokenAddress, mockChainId),
        { wrapper: createWrapper(testStore) },
      );

      expect(result.current.tokenInfo?.symbol).toBe('IMPORTED');
      expect(mockFetchAssetMetadata).not.toHaveBeenCalled();
      await flushAsyncUpdates();
    });

    it('should prefer cache over imported tokens', async () => {
      const testStore = createMockStore({
        tokensChainsCache: {
          [mockChainId]: {
            data: {
              [mockTokenAddress.toLowerCase()]: {
                symbol: 'CACHED',
                decimals: 18,
                iconUrl: 'https://example.com/cached.png',
              },
            },
          },
        },
        allTokens: {
          [mockChainId]: {
            '0xAccount': [
              {
                address: mockTokenAddress,
                symbol: 'IMPORTED',
                decimals: 6,
              },
            ],
          },
        },
      });

      const { result } = renderHook(
        () => useGatorPermissionTokenInfo(mockTokenAddress, mockChainId),
        { wrapper: createWrapper(testStore) },
      );

      expect(result.current.tokenInfo?.symbol).toBe('CACHED');
      await flushAsyncUpdates();
    });
  });

  describe('API fetching', () => {
    it('should fetch from API when external services are enabled', async () => {
      mockFetchAssetMetadata.mockResolvedValue({
        symbol: 'API',
        decimals: 18,
        image: 'https://example.com/api.png',
        assetId: `eip155:1/erc20:${mockTokenAddress}`,
        address: mockTokenAddress,
        chainId: mockChainId,
      });

      const testStore = createMockStore();
      const { result } = renderHook(
        () => useGatorPermissionTokenInfo(mockTokenAddress, mockChainId),
        { wrapper: createWrapper(testStore) },
      );

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.tokenInfo?.symbol).toBe('API');
        expect(mockFetchAssetMetadata).toHaveBeenCalledWith(
          mockTokenAddress,
          mockChainId,
        );
      });
    });

    it('should skip API when external services are disabled', async () => {
      mockGetTokenStandardAndDetailsByChain.mockResolvedValue({
        standard: 'ERC20',
        symbol: 'ONCHAIN',
        decimals: '18',
      });

      const testStore = createMockStore({
        useExternalServices: false,
      });

      const { result } = renderHook(
        () => useGatorPermissionTokenInfo(mockTokenAddress, mockChainId),
        { wrapper: createWrapper(testStore) },
      );

      await waitFor(() => {
        expect(mockFetchAssetMetadata).not.toHaveBeenCalled();
        expect(mockGetTokenStandardAndDetailsByChain).toHaveBeenCalled();
        expect(result.current.tokenInfo?.symbol).toBe('ONCHAIN');
      });
    });
  });

  describe('on-chain fallback', () => {
    it('should fall back to on-chain when API fails', async () => {
      mockFetchAssetMetadata.mockRejectedValue(new Error('API Error'));
      mockGetTokenStandardAndDetailsByChain.mockResolvedValue({
        standard: 'ERC20',
        symbol: 'ONCHAIN',
        decimals: '6',
      });

      const testStore = createMockStore();
      const { result } = renderHook(
        () => useGatorPermissionTokenInfo(mockTokenAddress, mockChainId),
        { wrapper: createWrapper(testStore) },
      );

      await waitFor(() => {
        expect(result.current.tokenInfo?.symbol).toBe('ONCHAIN');
        expect(result.current.tokenInfo?.decimals).toBe(6);
        expect(result.current.error).toBeNull();
      });
    });

    it('should parse decimals from decimal string', async () => {
      mockFetchAssetMetadata.mockResolvedValue(undefined);
      mockGetTokenStandardAndDetailsByChain.mockResolvedValue({
        standard: 'ERC20',
        symbol: 'TOKEN',
        decimals: '6',
      });

      const testStore = createMockStore();
      const { result } = renderHook(
        () => useGatorPermissionTokenInfo(mockTokenAddress, mockChainId),
        { wrapper: createWrapper(testStore) },
      );

      await waitFor(() => {
        expect(result.current.tokenInfo?.decimals).toBe(6);
      });
    });

    it('should parse decimals from hex string', async () => {
      mockFetchAssetMetadata.mockResolvedValue(undefined);
      mockGetTokenStandardAndDetailsByChain.mockResolvedValue({
        standard: 'ERC20',
        symbol: 'TOKEN',
        decimals: '0x12', // 18 in hex
      });

      const testStore = createMockStore();
      const { result } = renderHook(
        () => useGatorPermissionTokenInfo(mockTokenAddress, mockChainId),
        { wrapper: createWrapper(testStore) },
      );

      await waitFor(() => {
        expect(result.current.tokenInfo?.decimals).toBe(18);
      });
    });

    it('should use default values when both API and on-chain fail', async () => {
      mockFetchAssetMetadata.mockRejectedValue(new Error('API Error'));
      mockGetTokenStandardAndDetailsByChain.mockRejectedValue(
        new Error('On-chain Error'),
      );

      const testStore = createMockStore();
      const { result } = renderHook(
        () => useGatorPermissionTokenInfo(mockTokenAddress, mockChainId),
        { wrapper: createWrapper(testStore) },
      );

      await waitFor(() => {
        expect(result.current.tokenInfo?.symbol).toBe('Unknown Token');
        expect(result.current.tokenInfo?.decimals).toBeUndefined();
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('On-chain Error');
      });
    });
  });

  describe('edge cases', () => {
    it('should return default token info when tokenAddress is undefined without permission type', async () => {
      const testStore = createMockStore();
      const { result } = renderHook(
        () => useGatorPermissionTokenInfo(undefined, mockChainId),
        { wrapper: createWrapper(testStore) },
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.tokenInfo).toMatchObject({
        symbol: 'Unknown Token',
        chainId: mockChainId,
      });
      await flushAsyncUpdates();
    });

    it('should return default token info when chainId is undefined', async () => {
      const testStore = createMockStore();
      const { result } = renderHook(
        () => useGatorPermissionTokenInfo(mockTokenAddress, undefined),
        { wrapper: createWrapper(testStore) },
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.tokenInfo).toMatchObject({
        symbol: 'Unknown Token',
        chainId: '0x0',
      });
      await flushAsyncUpdates();
    });

    it('should handle case-insensitive address matching', async () => {
      const upperCaseAddress = mockTokenAddress.toUpperCase();
      const testStore = createMockStore({
        tokensChainsCache: {
          [mockChainId]: {
            data: {
              [mockTokenAddress.toLowerCase()]: {
                symbol: 'CACHED',
                decimals: 18,
                iconUrl: 'https://example.com/cached.png',
              },
            },
          },
        },
      });

      const { result } = renderHook(
        () => useGatorPermissionTokenInfo(upperCaseAddress, mockChainId),
        { wrapper: createWrapper(testStore) },
      );

      expect(result.current.tokenInfo?.symbol).toBe('CACHED');
      await flushAsyncUpdates();
    });
  });

  describe('caching behavior', () => {
    it('should cache fetched token info for subsequent calls', async () => {
      mockFetchAssetMetadata.mockResolvedValue({
        symbol: 'CACHED',
        decimals: 18,
        image: 'https://example.com/cached.png',
        assetId: `eip155:1/erc20:${mockTokenAddress}`,
        address: mockTokenAddress,
        chainId: mockChainId,
      });

      const testStore = createMockStore();

      // First call
      const { result: result1 } = renderHook(
        () => useGatorPermissionTokenInfo(mockTokenAddress, mockChainId),
        { wrapper: createWrapper(testStore) },
      );

      await waitFor(() => {
        expect(mockFetchAssetMetadata).toHaveBeenCalledTimes(1);
        expect(result1.current.tokenInfo?.symbol).toBe('CACHED');
      });

      // Second call should use cache
      const { result: result2 } = renderHook(
        () => useGatorPermissionTokenInfo(mockTokenAddress, mockChainId),
        { wrapper: createWrapper(testStore) },
      );

      await waitFor(() => {
        expect(result2.current.tokenInfo?.symbol).toBe('CACHED');
      });

      // API should still only be called once (reused from cache)
      expect(mockFetchAssetMetadata).toHaveBeenCalledTimes(1);
    });
  });
});
