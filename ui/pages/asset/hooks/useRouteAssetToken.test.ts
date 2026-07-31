import { renderHook } from '@testing-library/react-hooks';
import { CaipAssetType, Hex } from '@metamask/utils';
import { useAsyncResult } from '../../../hooks/useAsync';
import { TokenWithFiatAmount } from '../../../components/app/assets/types';
import { buildTokenFromCaipAssetId } from '../build-token-from-caip-asset-id';
import { getRouteAssetChainId, useRouteAssetToken } from './useRouteAssetToken';

jest.mock('../../../hooks/useAsync');
jest.mock('../build-token-from-caip-asset-id');

describe('useRouteAssetToken', () => {
  const mockUseAsyncResult = jest.mocked(useAsyncResult);
  const mockBuildTokenFromCaipAssetId = jest.mocked(buildTokenFromCaipAssetId);

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

  const fetchedToken = {
    address: '0x6b175474e89094c44da98b954eedeac495271d0f' as Hex,
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    chainId: '0x1' as Hex,
    decimals: 18,
    image: '',
    isNative: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAsyncResult.mockReturnValue({
      value: undefined,
      pending: false,
      error: undefined,
      status: 'success',
      idle: false,
    });
  });

  it('returns the owned token without fetching metadata', () => {
    const { result } = renderHook(() =>
      useRouteAssetToken({
        ownedToken,
        assetId: daiAssetId,
      }),
    );

    expect(result.current.token).toBe(ownedToken);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(mockUseAsyncResult).toHaveBeenCalledWith(expect.any(Function), [
      false,
      daiAssetId,
    ]);
  });

  it('returns the location state token when no owned token is available', () => {
    const { result } = renderHook(() =>
      useRouteAssetToken({
        locationStateToken,
        assetId: daiAssetId,
      }),
    );

    expect(result.current.token).toBe(locationStateToken);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(mockUseAsyncResult).toHaveBeenCalledWith(expect.any(Function), [
      false,
      daiAssetId,
    ]);
  });

  it('returns the fetched token when metadata is resolved', () => {
    mockUseAsyncResult.mockReturnValue({
      value: fetchedToken,
      pending: false,
      error: undefined,
      status: 'success',
      idle: false,
    });

    const { result } = renderHook(() =>
      useRouteAssetToken({
        assetId: daiAssetId,
      }),
    );

    expect(result.current.token).toEqual(fetchedToken);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(mockUseAsyncResult).toHaveBeenCalledWith(expect.any(Function), [
      true,
      daiAssetId,
    ]);
  });

  it('reports loading while metadata fetch is pending', () => {
    mockUseAsyncResult.mockReturnValue({
      value: undefined,
      pending: true,
      error: undefined,
      status: 'pending',
      idle: false,
    });

    const { result } = renderHook(() =>
      useRouteAssetToken({
        assetId: daiAssetId,
      }),
    );

    expect(result.current.token).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasError).toBe(false);
  });

  it('reports an error when metadata fetch fails', () => {
    mockUseAsyncResult.mockReturnValue({
      value: undefined,
      pending: false,
      error: new Error('Token API unavailable'),
      status: 'error',
      idle: false,
    });

    const { result } = renderHook(() =>
      useRouteAssetToken({
        assetId: daiAssetId,
      }),
    );

    expect(result.current.token).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(true);
  });

  it('does not fetch metadata when assetId is invalid', () => {
    const { result } = renderHook(() =>
      useRouteAssetToken({
        assetId: 'not-a-caip-asset-id' as CaipAssetType,
      }),
    );

    expect(result.current.token).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(mockUseAsyncResult).toHaveBeenCalledWith(expect.any(Function), [
      false,
      'not-a-caip-asset-id',
    ]);
  });

  it('builds token metadata from assetId via buildTokenFromCaipAssetId', async () => {
    mockBuildTokenFromCaipAssetId.mockResolvedValue(fetchedToken);

    renderHook(() =>
      useRouteAssetToken({
        assetId: daiAssetId,
      }),
    );

    const fetchMetadata = mockUseAsyncResult.mock.calls[0][0];
    const token = await fetchMetadata();

    expect(mockBuildTokenFromCaipAssetId).toHaveBeenCalledWith(daiAssetId);
    expect(token).toEqual(fetchedToken);
  });

  it('skips metadata fetch when an owned token is already available', async () => {
    renderHook(() =>
      useRouteAssetToken({
        ownedToken,
        assetId: daiAssetId,
      }),
    );

    const fetchMetadata = mockUseAsyncResult.mock.calls[0][0];
    const token = await fetchMetadata();

    expect(token).toBeUndefined();
    expect(mockBuildTokenFromCaipAssetId).not.toHaveBeenCalled();
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
