import { renderHook } from '@testing-library/react-hooks';
import { TokensResponse } from '@metamask/assets-controllers';
import { TokenStandard } from '../../shared/constants/transaction';
import { getCurrentChainId } from '../selectors';
import { getNFTTokenInfo } from '../store/actions';
import { useNftCollectionsMetadata } from './useNftCollectionsMetadata';

jest.mock('react-redux', () => ({
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelector: (selector: any) => selector(),
}));

jest.mock('../selectors', () => ({
  getCurrentChainId: jest.fn(),
}));

jest.mock('../store/actions', () => ({
  getNFTTokenInfo: jest.fn(),
}));

const CHAIN_ID_MOCK = '0x1';
const ERC_721_ADDRESS_1 = '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb';
const ERC_721_TOKEN_ID_1 = '0x11';
const ERC_721_COLLECTION_1_MOCK = {
  id: ERC_721_ADDRESS_1,
  name: 'Erc 721 1',
  slug: 'erc-721-1',
  symbol: 'ERC721-1',
  imageUrl: 'url',
};
const ERC_721_TOKEN_MOCK_1 = {
  token: {
    collection: ERC_721_COLLECTION_1_MOCK,
    contract: ERC_721_ADDRESS_1,
    tokenId: ERC_721_TOKEN_ID_1,
  },
};

const ERC_721_ADDRESS_2 = '0x06012c8cf97bead5deae237070f9587f8e7a266d';
const ERC_721_TOKEN_ID_2 = '0x12';
const ERC_721_COLLECTION_2_MOCK = {
  id: ERC_721_ADDRESS_2,
  name: 'Erc 721 2',
  slug: 'erc-721-2',
  symbol: 'ERC721-2',
  imageUrl: 'url',
};
const ERC_721_TOKEN_MOCK_2 = {
  token: {
    collection: ERC_721_COLLECTION_2_MOCK,
    contract: ERC_721_ADDRESS_2,
    tokenId: ERC_721_TOKEN_ID_2,
  },
};

describe('useNftCollectionsMetadata', () => {
  const mockGetCurrentChainId = jest.mocked(getCurrentChainId);
  const mockGetNFTTokenInfo = jest.mocked(getNFTTokenInfo);

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetCurrentChainId.mockReturnValue(CHAIN_ID_MOCK);
    mockGetNFTTokenInfo.mockResolvedValue([
      ERC_721_TOKEN_MOCK_1,
      ERC_721_TOKEN_MOCK_2,
    ] as TokensResponse[]);
  });

  it('calls NFT tokens API and returns the correct data structure', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useNftCollectionsMetadata([
        {
          value: ERC_721_ADDRESS_1,
          tokenId: ERC_721_TOKEN_ID_1,
          standard: TokenStandard.ERC721,
        },
        {
          value: ERC_721_ADDRESS_2,
          tokenId: ERC_721_TOKEN_ID_2,
          standard: TokenStandard.ERC721,
        },
      ]),
    );

    await waitForNextUpdate();

    expect(mockGetNFTTokenInfo).toHaveBeenCalledTimes(1);
    expect(result.current).toStrictEqual({
      [`${ERC_721_ADDRESS_1.toLowerCase()}:${ERC_721_TOKEN_ID_1}`]:
        ERC_721_COLLECTION_1_MOCK,
      [`${ERC_721_ADDRESS_2.toLowerCase()}:${ERC_721_TOKEN_ID_2}`]:
        ERC_721_COLLECTION_2_MOCK,
    });
  });

  describe('does not call NFT tokens API', () => {
    it('if there are no contracts to fetch', async () => {
      renderHook(() => useNftCollectionsMetadata([]));
      expect(mockGetNFTTokenInfo).not.toHaveBeenCalled();
    });

    it('if there are no valid nft request', async () => {
      renderHook(() =>
        useNftCollectionsMetadata([
          {
            value: '0xERC20Address',
            standard: TokenStandard.ERC20,
          },
        ]),
      );
      expect(mockGetNFTTokenInfo).not.toHaveBeenCalled();
    });
  });

  it('does memoise result for same requests', async () => {
    const { waitForNextUpdate, rerender } = renderHook(() =>
      useNftCollectionsMetadata([
        {
          value: ERC_721_ADDRESS_1,
          tokenId: ERC_721_TOKEN_ID_1,
          standard: TokenStandard.ERC721,
        },
        {
          value: ERC_721_ADDRESS_2,
          tokenId: ERC_721_TOKEN_ID_2,
          standard: TokenStandard.ERC721,
        },
      ]),
    );

    await waitForNextUpdate();
    rerender();

    expect(mockGetNFTTokenInfo).toHaveBeenCalledTimes(1);
  });
});
