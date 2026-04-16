import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { AssetType } from '../../../../../../shared/constants/transaction';
import { useAssetMetadata } from './useAssetMetadata';

// Mock dependencies
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const mockFetchAssetMetadata = jest.fn();
const mockGetAssetImageUrl = jest.fn();

jest.mock('../../../../../../shared/lib/asset-utils', () => ({
  fetchAssetMetadata: (...args: unknown[]) => mockFetchAssetMetadata(...args),
  getAssetImageUrl: (...args: unknown[]) => mockGetAssetImageUrl(...args),
}));

const mockChainId = '0x1';
const mockSearchQuery = '0x123asdfasdfasdfasdfasdfasadssdas';
const mockAssetId = 'eip155:1/erc20:0x123';
const mockAbortController = { current: new AbortController() };
describe('useAssetMetadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSelector as jest.Mock).mockReturnValue(true); // allowExternalServices = true
    mockGetAssetImageUrl.mockReturnValue('mock-image-url');
  });

  it('should return undefined when external services are disabled', async () => {
    (useSelector as jest.Mock).mockReturnValue(false); // allowExternalServices = false

    const { result, waitForNextUpdate } = renderHook(() =>
      useAssetMetadata(mockSearchQuery, true, mockAbortController, mockChainId),
    );

    await waitForNextUpdate();
    expect(result.current).toBeUndefined();
    expect(mockFetchAssetMetadata).not.toHaveBeenCalled();
  });

  it('should return undefined when chainId is not provided', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useAssetMetadata(mockSearchQuery, true, mockAbortController),
    );

    await waitForNextUpdate();
    expect(result.current).toBeUndefined();
    expect(mockFetchAssetMetadata).not.toHaveBeenCalled();
  });

  it('should return undefined when search query is empty', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useAssetMetadata('', true, mockAbortController, mockChainId),
    );

    await waitForNextUpdate();
    expect(result.current).toBeUndefined();
    expect(mockFetchAssetMetadata).not.toHaveBeenCalled();
  });

  it('should fetch and return asset metadata when conditions are met', async () => {
    const mockMetadata = {
      address: '0x123asdfasdfasdfasdfasdfasadssdas',
      symbol: 'TEST',
      decimals: 18,
      assetId: mockAssetId,
      chainId: mockChainId,
    };

    mockFetchAssetMetadata.mockResolvedValueOnce(mockMetadata);

    const { result, waitForNextUpdate } = renderHook(() =>
      useAssetMetadata(mockSearchQuery, true, mockAbortController, mockChainId),
    );

    await waitForNextUpdate();

    expect(result.current).toEqual({
      ...mockMetadata,
      chainId: mockChainId,
      isNative: false,
      type: AssetType.token,
      image: 'mock-image-url',
      balance: '',
      string: '',
    });

    expect(mockFetchAssetMetadata).toHaveBeenCalledWith(
      mockSearchQuery.trim(),
      mockChainId,
      mockAbortController.current.signal,
    );
    expect(mockGetAssetImageUrl).toHaveBeenCalledWith(mockAssetId, mockChainId);
  });

  it('should return undefined when fetchAssetMetadata returns undefined', async () => {
    mockFetchAssetMetadata.mockResolvedValueOnce(undefined);

    const { result, waitForNextUpdate } = renderHook(() =>
      useAssetMetadata(mockSearchQuery, true, mockAbortController, mockChainId),
    );

    await waitForNextUpdate();
    expect(result.current).toBeUndefined();

    expect(mockFetchAssetMetadata).toHaveBeenCalledWith(
      mockSearchQuery.trim(),
      mockChainId,
      mockAbortController.current.signal,
    );
  });

  it('should handle errors gracefully', async () => {
    mockFetchAssetMetadata.mockRejectedValueOnce(new Error('API Error'));

    const { result, waitForNextUpdate } = renderHook(() =>
      useAssetMetadata(mockSearchQuery, true, mockAbortController, mockChainId),
    );

    await waitForNextUpdate();
    expect(result.current).toBeUndefined();

    expect(mockFetchAssetMetadata).toHaveBeenCalledWith(
      mockSearchQuery.trim(),
      mockChainId,
      mockAbortController.current.signal,
    );
  });
});
