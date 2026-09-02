import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchTokenAssets } from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import type { TokenAsset } from '@metamask/assets-controllers';
import { getUseExternalServices } from '../../selectors';
import { getIsSecurityTrustTdpEnabled } from '../../selectors/multichain/feature-flags';
import { getTokenAssetQueryKey } from './tokenAssetQuery';
import { useTokenAssetSecurityResults } from './useTokenAssetSecurityResults';

jest.mock('@metamask/assets-controllers', () => ({
  fetchTokenAssets: jest.fn(),
}));

jest.mock('../../selectors', () => ({
  getUseExternalServices: jest.fn(),
}));

jest.mock('../../selectors/multichain/feature-flags', () => ({
  getIsSecurityTrustTdpEnabled: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

const mockGetUseExternalServices = jest.mocked(getUseExternalServices);
const mockGetIsSecurityTrustTdpEnabled = jest.mocked(
  getIsSecurityTrustTdpEnabled,
);
const mockFetchTokenAssets = jest.mocked(fetchTokenAssets);

const usdcAssetId =
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CaipAssetType;

const createTokenAsset = (resultType: string): TokenAsset =>
  ({
    assetId: usdcAssetId,
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    securityData: {
      resultType,
      features: [],
    },
  }) as unknown as TokenAsset;

describe('useTokenAssetSecurityResults', () => {
  const createWrapper = (queryClient: QueryClient) =>
    function wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );
    };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUseExternalServices.mockReturnValue(true);
    mockGetIsSecurityTrustTdpEnabled.mockReturnValue(true);
    mockFetchTokenAssets.mockResolvedValue([]);
  });

  it('returns an empty map when security trust is disabled', () => {
    mockGetIsSecurityTrustTdpEnabled.mockReturnValue(false);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(
      getTokenAssetQueryKey(usdcAssetId),
      createTokenAsset('Verified'),
    );

    const { result } = renderHook(
      () =>
        useTokenAssetSecurityResults({
          assetIds: [usdcAssetId],
        }),
      { wrapper: createWrapper(queryClient) },
    );

    expect(result.current).toEqual({});
    expect(mockFetchTokenAssets).not.toHaveBeenCalled();
  });

  it('returns an empty map when external services are off', () => {
    mockGetUseExternalServices.mockReturnValue(false);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(
      getTokenAssetQueryKey(usdcAssetId),
      createTokenAsset('Verified'),
    );

    const { result } = renderHook(
      () =>
        useTokenAssetSecurityResults({
          assetIds: [usdcAssetId],
        }),
      { wrapper: createWrapper(queryClient) },
    );

    expect(result.current).toEqual({});
    expect(mockFetchTokenAssets).not.toHaveBeenCalled();
  });

  it('reads security result types from the query cache', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(
      getTokenAssetQueryKey(usdcAssetId),
      createTokenAsset('Verified'),
    );

    const { result } = renderHook(
      () =>
        useTokenAssetSecurityResults({
          assetIds: [usdcAssetId],
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current[usdcAssetId]).toBe('Verified');
    });
    expect(mockFetchTokenAssets).not.toHaveBeenCalled();
  });

  it('fetches missing assets and returns security result types', async () => {
    mockFetchTokenAssets.mockResolvedValue([createTokenAsset('Warning')]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderHook(
      () =>
        useTokenAssetSecurityResults({
          assetIds: [usdcAssetId],
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current[usdcAssetId]).toBe('Warning');
    });
    expect(mockFetchTokenAssets).toHaveBeenCalledTimes(1);
  });

  it('does not refetch when remounting with fresh cache', async () => {
    mockFetchTokenAssets.mockResolvedValue([createTokenAsset('Verified')]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { unmount } = renderHook(
      () =>
        useTokenAssetSecurityResults({
          assetIds: [usdcAssetId],
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(mockFetchTokenAssets).toHaveBeenCalledTimes(1);
    });

    unmount();
    mockFetchTokenAssets.mockClear();

    renderHook(
      () =>
        useTokenAssetSecurityResults({
          assetIds: [usdcAssetId],
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(mockFetchTokenAssets).not.toHaveBeenCalled();
    });
  });

  it('updates when the query cache changes', async () => {
    mockFetchTokenAssets.mockImplementation(() => new Promise(() => undefined));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderHook(
      () =>
        useTokenAssetSecurityResults({
          assetIds: [usdcAssetId],
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await act(async () => {
      queryClient.setQueryData(
        getTokenAssetQueryKey(usdcAssetId),
        createTokenAsset('Warning'),
      );
    });

    await waitFor(() => {
      expect(result.current[usdcAssetId]).toBe('Warning');
    });
  });
});
