import { waitFor } from '@testing-library/react';
import { useSelector } from 'react-redux';

import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import {
  getAccountGroupWithInternalAccounts,
  getSelectedAccountGroup,
} from '../../../../selectors/multichain-accounts/account-tree';
// This is fine to use it in send flow - might be removed in the future
// eslint-disable-next-line no-restricted-syntax
import { getNftsByChainByAccount } from '../../../../selectors/nft';
import { AssetStandard, type Asset } from '../../types/send';
import * as useChainNetworkNameAndImageModule from '../useChainNetworkNameAndImage';
import * as useERC1155BalanceCheckerModule from './useERC1155BalanceChecker';
import { useSendNfts } from './useSendNfts';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../useChainNetworkNameAndImage');
jest.mock('./useERC1155BalanceChecker');

const mockUseSelector = jest.mocked(useSelector);
const mockUseChainNetworkNameAndImageMap = jest.mocked(
  useChainNetworkNameAndImageModule.useChainNetworkNameAndImageMap,
);
const mockUseERC1155BalanceChecker = jest.mocked(
  useERC1155BalanceCheckerModule.useERC1155BalanceChecker,
);

describe('useSendNfts', () => {
  const mockNftsData = {
    '0xAccount1': {
      '1': [
        {
          address: '0xNft1',
          tokenId: '1',
          name: 'Test NFT 1',
          standard: AssetStandard.ERC721,
          isCurrentlyOwned: true,
        },
        {
          address: '0xNft2',
          tokenId: '2',
          name: 'Test NFT 2',
          standard: AssetStandard.ERC1155,
          isCurrentlyOwned: true,
        },
      ],
      '137': [
        {
          address: '0xNft3',
          tokenId: '3',
          name: 'Polygon NFT',
          standard: AssetStandard.ERC721,
          isCurrentlyOwned: true,
        },
      ],
    },
    '0xAccount2': {
      '1': [
        {
          address: '0xNft4',
          tokenId: '4',
          name: 'Account2 NFT',
          standard: AssetStandard.ERC721,
          isCurrentlyOwned: true,
        },
      ],
    },
  };

  const mockAccounts = [
    { id: 'account1', address: '0xAccount1' },
    { id: 'account2', address: '0xAccount2' },
  ];

  const mockChainNetworkMap = new Map([
    ['1', { networkName: 'Ethereum', networkImage: 'eth.svg' }],
    ['137', { networkName: 'Polygon', networkImage: 'polygon.svg' }],
  ]);

  const mockFetchBalanceForNft = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSelector.mockImplementation((selector) => {
      if (selector === getNftsByChainByAccount) {
        return mockNftsData;
      }
      if (selector === getSelectedAccountGroup) {
        return 'dummy_group_id';
      }
      if (selector === getAccountGroupWithInternalAccounts) {
        return [{ accounts: mockAccounts, id: 'dummy_group_id' }];
      }
      return undefined;
    });

    mockUseChainNetworkNameAndImageMap.mockReturnValue(mockChainNetworkMap);
    mockUseERC1155BalanceChecker.mockReturnValue({
      fetchBalanceForNft: mockFetchBalanceForNft,
    });
    mockFetchBalanceForNft.mockResolvedValue(null);
  });

  it('returns empty array initially and updates with transformed NFTs', async () => {
    const { result } = renderHookWithProvider(() => useSendNfts(), mockState);

    expect(result.current).toEqual([]);

    await waitFor(() => {
      expect(result.current.length).toBe(4);
    });
  });

  it('transforms NFTs to Asset format with account and network data', async () => {
    const { result } = renderHookWithProvider(() => useSendNfts(), mockState);

    await waitFor(() => {
      const firstAsset = result.current[0];
      expect(firstAsset).toEqual({
        address: '0xNft1',
        tokenId: '1',
        name: 'Test NFT 1',
        standard: AssetStandard.ERC721,
        accountId: 'account1',
        accountAddress: '0xAccount1',
        chainId: '1',
        networkName: 'Ethereum',
        networkImage: 'eth.svg',
        isCurrentlyOwned: true,
      });
    });
  });

  it('fetches balances for ERC1155 NFTs', async () => {
    const mockBalanceResult = {
      nft: {
        address: '0xNft2',
        tokenId: '2',
        chainId: '1',
        accountId: 'account1',
      },
      balance: 5,
    };
    mockFetchBalanceForNft.mockResolvedValue(mockBalanceResult);

    const { result } = renderHookWithProvider(() => useSendNfts(), mockState);

    await waitFor(() => {
      expect(mockFetchBalanceForNft).toHaveBeenCalledWith(
        expect.objectContaining({
          standard: AssetStandard.ERC1155,
          address: '0xNft2',
          tokenId: '2',
          name: 'Test NFT 2',
          accountId: 'account1',
          accountAddress: '0xAccount1',
          chainId: '1',
          networkName: 'Ethereum',
          networkImage: 'eth.svg',
        }),
        0,
        expect.any(Array),
      );
    });

    await waitFor(() => {
      const erc1155Asset = result.current.find(
        (nft: Asset) => nft.address === '0xNft2' && nft.tokenId === '2',
      );
      expect(erc1155Asset?.balance).toBe(5);
    });
  });

  it('handles balance fetch failures gracefully', async () => {
    mockFetchBalanceForNft.mockRejectedValue(new Error('Balance fetch failed'));

    const { result } = renderHookWithProvider(() => useSendNfts(), mockState);

    await waitFor(() => {
      expect(result.current.length).toBe(4);
    });

    const erc1155Asset = result.current.find(
      (nft: Asset) => nft.standard === AssetStandard.ERC1155,
    );
    expect(erc1155Asset?.balance).toBeUndefined();
  });

  it('returns empty array when no NFTs exist', async () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getNftsByChainByAccount) {
        return {};
      }
      if (selector === getSelectedAccountGroup) {
        return 'dummy_group_id';
      }
      if (selector === getAccountGroupWithInternalAccounts) {
        return [{ accounts: mockAccounts, id: 'dummy_group_id' }];
      }
      return undefined;
    });

    const { result } = renderHookWithProvider(() => useSendNfts(), mockState);

    expect(result.current).toEqual([]);
  });

  it('returns empty array when no accounts exist', async () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getNftsByChainByAccount) {
        return mockNftsData;
      }
      if (selector === getSelectedAccountGroup) {
        return undefined;
      }
      if (selector === getAccountGroupWithInternalAccounts) {
        return [];
      }
      return undefined;
    });

    const { result } = renderHookWithProvider(() => useSendNfts(), mockState);

    expect(result.current).toEqual([]);
  });

  it('filters out NFTs for accounts not in selected accounts group', async () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getNftsByChainByAccount) {
        return mockNftsData;
      }
      if (selector === getSelectedAccountGroup) {
        return 'dummy_group_id';
      }
      if (selector === getAccountGroupWithInternalAccounts) {
        return [{ accounts: [mockAccounts[0]], id: 'dummy_group_id' }];
      }
      return undefined;
    });

    const { result } = renderHookWithProvider(() => useSendNfts(), mockState);

    await waitFor(() => {
      expect(result.current.length).toBe(3);
      expect(
        result.current.every(
          (nft: Asset) => nft.accountAddress === '0xAccount1',
        ),
      ).toBe(true);
    });
  });

  it('adds network information when available in chain map', async () => {
    const { result } = renderHookWithProvider(() => useSendNfts(), mockState);

    await waitFor(() => {
      const ethereumNft = result.current.find(
        (nft: Asset) => nft.chainId === '1',
      );
      expect(ethereumNft?.networkName).toBe('Ethereum');
      expect(ethereumNft?.networkImage).toBe('eth.svg');

      const polygonNft = result.current.find(
        (nft: Asset) => nft.chainId === '137',
      );
      expect(polygonNft?.networkName).toBe('Polygon');
      expect(polygonNft?.networkImage).toBe('polygon.svg');
    });
  });

  it('handles missing network information gracefully', async () => {
    const emptyChainMap = new Map();
    mockUseChainNetworkNameAndImageMap.mockReturnValue(emptyChainMap);

    const { result } = renderHookWithProvider(() => useSendNfts(), mockState);

    await waitFor(() => {
      const nft = result.current[0];
      expect(nft?.networkName).toBeUndefined();
      expect(nft?.networkImage).toBeUndefined();
    });
  });

  it('updates NFTs when dependencies change', async () => {
    const { result, rerender } = renderHookWithProvider(
      () => useSendNfts(),
      mockState,
    );

    await waitFor(() => {
      expect(result.current.length).toBe(4);
    });

    const newNftsData = {
      '0xAccount1': {
        '1': [
          {
            address: '0xNewNft',
            tokenId: '100',
            name: 'New NFT',
            standard: AssetStandard.ERC721,
            isCurrentlyOwned: true,
          },
        ],
      },
    };

    mockUseSelector.mockImplementation((selector) => {
      if (selector === getNftsByChainByAccount) {
        return newNftsData;
      }
      if (selector === getSelectedAccountGroup) {
        return 'dummy_group_id';
      }
      if (selector === getAccountGroupWithInternalAccounts) {
        return [{ accounts: mockAccounts, id: 'dummy_group_id' }];
      }
      return undefined;
    });

    rerender();

    await waitFor(() => {
      expect(result.current.length).toBe(1);
      expect(result.current[0].name).toBe('New NFT');
    });
  });

  it('handles partial balance fetch failures for ERC1155 NFTs', async () => {
    const successResult = {
      nft: {
        address: '0xNft2',
        tokenId: '2',
        chainId: '1',
        accountId: 'account1',
      },
      balance: 5,
    };

    mockFetchBalanceForNft
      .mockResolvedValueOnce(successResult)
      .mockRejectedValueOnce(new Error('Failed'));

    const { result } = renderHookWithProvider(() => useSendNfts(), mockState);

    await waitFor(() => {
      const updatedNft = result.current.find(
        (nft: Asset) => nft.address === '0xNft2' && nft.tokenId === '2',
      );
      expect(updatedNft?.balance).toBe(5);
    });
  });

  it('only calls fetchBalanceForNft for ERC1155 NFTs', async () => {
    renderHookWithProvider(() => useSendNfts(), mockState);

    await waitFor(() => {
      expect(mockFetchBalanceForNft).toHaveBeenCalledTimes(1);
      expect(mockFetchBalanceForNft).toHaveBeenCalledWith(
        expect.objectContaining({
          standard: AssetStandard.ERC1155,
          name: 'Test NFT 2',
          accountId: 'account1',
          accountAddress: '0xAccount1',
          chainId: '1',
        }),
        0,
        expect.any(Array),
      );
    });
  });

  it('preserves NFT data when balance fetch returns null', async () => {
    mockFetchBalanceForNft.mockResolvedValue(null);

    const { result } = renderHookWithProvider(() => useSendNfts(), mockState);

    await waitFor(() => {
      const erc1155Nft = result.current.find(
        (nft: Asset) => nft.standard === AssetStandard.ERC1155,
      );
      expect(erc1155Nft?.address).toBe('0xNft2');
      expect(erc1155Nft?.balance).toBeUndefined();
    });
  });
});
