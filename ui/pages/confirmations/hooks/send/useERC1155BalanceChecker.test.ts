import { renderHook } from '@testing-library/react-hooks';
import { useDispatch } from 'react-redux';

import {
  findNetworkClientIdByChainId,
  getERC1155BalanceOf,
} from '../../../../store/actions';
import { Asset, AssetStandard } from '../../types/send';
import { useERC1155BalanceChecker } from './useERC1155BalanceChecker';

jest.mock('../../../../store/actions');
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

const mockFindNetworkClientIdByChainId =
  findNetworkClientIdByChainId as jest.MockedFunction<
    typeof findNetworkClientIdByChainId
  >;
const mockGetERC1155BalanceOf = getERC1155BalanceOf as jest.MockedFunction<
  typeof getERC1155BalanceOf
>;
const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
const mockDispatch = jest.fn();

describe('useERC1155BalanceChecker', () => {
  const mockERC1155Asset: Asset = {
    address: '0x123456789abcdef',
    accountAddress: '0xabcdef123456789',
    chainId: '0x1',
    tokenId: '1',
    standard: AssetStandard.ERC1155,
  };

  const mockERC721Asset: Asset = {
    address: '0x987654321fedcba',
    accountAddress: '0xfedcba987654321',
    chainId: '0x1',
    tokenId: '2',
    standard: AssetStandard.ERC721,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDispatch.mockReturnValue(mockDispatch);
    mockFindNetworkClientIdByChainId.mockResolvedValue('mainnet' as never);
    mockGetERC1155BalanceOf.mockResolvedValue('5');
  });

  it('returns fetchBalanceForNft function', () => {
    const { result } = renderHook(() => useERC1155BalanceChecker());

    expect(result.current).toEqual({
      fetchBalanceForNft: expect.any(Function),
    });
  });

  it('returns null for non-ERC1155 NFTs', async () => {
    const { result } = renderHook(() => useERC1155BalanceChecker());

    const response = await result.current.fetchBalanceForNft(mockERC721Asset);

    expect(response).toBe(null);
    expect(mockFindNetworkClientIdByChainId).not.toHaveBeenCalled();
    expect(mockGetERC1155BalanceOf).not.toHaveBeenCalled();
  });

  it('fetches balance successfully for ERC1155 NFT', async () => {
    const { result } = renderHook(() => useERC1155BalanceChecker());

    const response = await result.current.fetchBalanceForNft(mockERC1155Asset);

    expect(mockFindNetworkClientIdByChainId).toHaveBeenCalledWith('0x1');
    expect(mockGetERC1155BalanceOf).toHaveBeenCalledWith(
      '0xabcdef123456789',
      '0x123456789abcdef',
      '1',
      'mainnet',
    );
    expect(response).toEqual({
      nft: mockERC1155Asset,
      balance: 5,
    });
  });

  it('converts string balance to number', async () => {
    mockGetERC1155BalanceOf.mockResolvedValue('123');

    const { result } = renderHook(() => useERC1155BalanceChecker());
    const response = await result.current.fetchBalanceForNft(mockERC1155Asset);

    expect(response?.balance).toBe(123);
    expect(typeof response?.balance).toBe('number');
  });

  it('handles zero balance correctly', async () => {
    mockGetERC1155BalanceOf.mockResolvedValue('0');

    const { result } = renderHook(() => useERC1155BalanceChecker());
    const response = await result.current.fetchBalanceForNft(mockERC1155Asset);

    expect(response?.balance).toBe(0);
  });

  it('returns null and logs error when findNetworkClientIdByChainId fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Network client not found');
    mockFindNetworkClientIdByChainId.mockRejectedValue(error as never);

    const { result } = renderHook(() => useERC1155BalanceChecker());
    const response = await result.current.fetchBalanceForNft(mockERC1155Asset);

    expect(response).toBe(null);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching ERC1155 balance:',
      error,
    );
    expect(mockGetERC1155BalanceOf).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('returns null and logs error when getERC1155BalanceOf fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Balance fetch failed');
    mockGetERC1155BalanceOf.mockRejectedValue(error);

    const { result } = renderHook(() => useERC1155BalanceChecker());
    const response = await result.current.fetchBalanceForNft(mockERC1155Asset);

    expect(response).toBe(null);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching ERC1155 balance:',
      error,
    );

    consoleSpy.mockRestore();
  });

  it('handles NFT with different chain ID', async () => {
    const polygonAsset: Asset = {
      ...mockERC1155Asset,
      chainId: '0x89', // Polygon mainnet
    };

    const { result } = renderHook(() => useERC1155BalanceChecker());
    await result.current.fetchBalanceForNft(polygonAsset);

    expect(mockFindNetworkClientIdByChainId).toHaveBeenCalledWith('0x89');
  });

  it('memoizes fetchBalanceForNft function correctly', () => {
    const { result, rerender } = renderHook(() => useERC1155BalanceChecker());

    const firstRenderFunction = result.current.fetchBalanceForNft;
    rerender();
    const secondRenderFunction = result.current.fetchBalanceForNft;

    expect(firstRenderFunction).toBe(secondRenderFunction);
  });

  it('handles NFT with missing required properties gracefully', async () => {
    const incompleteAsset: Asset = {
      standard: AssetStandard.ERC1155,
      address: '0x123',
      // Missing tokenId, chainId, accountAddress
    };

    const { result } = renderHook(() => useERC1155BalanceChecker());
    await result.current.fetchBalanceForNft(incompleteAsset);

    // The hook will attempt the call but may fail due to missing properties
    expect(mockFindNetworkClientIdByChainId).toHaveBeenCalledWith(undefined);
  });
});
