import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchTokenAssets } from '@metamask/assets-controllers';
import { CaipAssetType, Hex } from '@metamask/utils';
import { TokenWithFiatAmount } from '../../../components/app/assets/types';
import { getTokenAssetQueryKey } from '#ui/hooks/token-asset/tokenAssetQuery';
import { getRouteAssetChainId, useRouteAssetToken } from './useRouteAssetToken';

jest.mock('@metamask/assets-controllers', () => ({
  fetchTokenAssets: jest.fn(),
}));

jest.mock('#ui/selectors/multichain/feature-flags', () => ({
  getIsSecurityTrustTdpEnabled: jest.fn(() => true),
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

const mockFetchTokenAssets = jest.mocked(fetchTokenAssets);

const createWrapper = (queryClient?: QueryClient) => {
  const client =
    queryClient ??
    new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

  return function wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
};

describe('useRouteAssetToken', () => {
  const daiAssetId =
    'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f' as CaipAssetType;

  const ownedToken = {
    address: '0x6b175474e89094c44da98b954eedeac495271d0f' as Hex,
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    chainId: '0x1' as Hex,
    decimals: 18,
    image: '',
    isNative: false,
    secondary: null,
    title: 'DAI',
  } as TokenWithFiatAmount;

  const locationStateToken = {
    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    chainId: '0x1',
    decimals: 18,
  };

  const fetchedTokenAsset = {
    assetId: daiAssetId,
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchTokenAssets.mockResolvedValue([fetchedTokenAsset]);
  });

  it('returns the owned token without fetching metadata', () => {
    const { result } = renderHook(
      () =>
        useRouteAssetToken({
          ownedToken,
          assetId: daiAssetId,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.token).toBe(ownedToken);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(mockFetchTokenAssets).not.toHaveBeenCalled();
  });

  it('returns the location state token when no owned token is available', () => {
    const { result } = renderHook(
      () =>
        useRouteAssetToken({
          locationStateToken,
          assetId: daiAssetId,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.token).toBe(locationStateToken);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(mockFetchTokenAssets).not.toHaveBeenCalled();
  });

  it('maps TokenAsset metadata for an unowned ERC-20', async () => {
    const { result } = renderHook(
      () =>
        useRouteAssetToken({
          assetId: daiAssetId,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.token).toMatchObject({
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      chainId: '0x1',
      decimals: 18,
      isNative: false,
    });
    expect(result.current.hasError).toBe(false);
    expect(mockFetchTokenAssets).toHaveBeenCalledWith([daiAssetId], {
      includeTokenSecurityData: true,
    });
  });

  it('uses a warm TokenAsset cache without fetching', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(
      getTokenAssetQueryKey(daiAssetId),
      fetchedTokenAsset,
    );

    const { result } = renderHook(
      () =>
        useRouteAssetToken({
          assetId: daiAssetId,
        }),
      { wrapper: createWrapper(queryClient) },
    );

    expect(result.current.token).toMatchObject({
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
    });
    expect(result.current.isLoading).toBe(false);
    expect(mockFetchTokenAssets).not.toHaveBeenCalled();
  });

  it('reports loading while metadata fetch is pending', () => {
    mockFetchTokenAssets.mockImplementation(() => new Promise(() => undefined));

    const { result } = renderHook(
      () =>
        useRouteAssetToken({
          assetId: daiAssetId,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.token).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasError).toBe(false);
  });

  it('reports an error when metadata fetch fails', async () => {
    mockFetchTokenAssets.mockRejectedValue(new Error('Token API unavailable'));

    const { result } = renderHook(
      () =>
        useRouteAssetToken({
          assetId: daiAssetId,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.token).toBeUndefined();
    expect(result.current.hasError).toBe(true);
  });

  it('does not fetch metadata when assetId is invalid', () => {
    const { result } = renderHook(
      () =>
        useRouteAssetToken({
          assetId: 'not-a-caip-asset-id' as CaipAssetType,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.token).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(mockFetchTokenAssets).not.toHaveBeenCalled();
  });

  it('builds native token metadata without calling the Token API', () => {
    const { result } = renderHook(
      () =>
        useRouteAssetToken({
          assetId: 'eip155:1/slip44:60' as CaipAssetType,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.token).toMatchObject({
      symbol: 'ETH',
      chainId: '0x1',
      decimals: 18,
      isNative: true,
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(mockFetchTokenAssets).not.toHaveBeenCalled();
  });
});

describe('getRouteAssetChainId', () => {
  it('returns the token chain id when present', () => {
    expect(
      getRouteAssetChainId({
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'ETH',
        name: 'Ethereum',
        chainId: 'eip155:1',
        decimals: 18,
      }),
    ).toBe('eip155:1');
  });

  it('falls back to the route chain id when token is missing', () => {
    expect(getRouteAssetChainId(undefined, '0x1')).toBe('0x1');
  });
});
