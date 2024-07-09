import { renderHook } from '@testing-library/react-hooks';
import { getCurrentChainId } from '../selectors';
import { fetchNftCollectionsMetadata } from '../store/actions';
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
  fetchNftCollectionsMetadata: jest.fn(),
}));

const ERC_721_ADDRESS_1 = '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb';
const ERC_721_ADDRESS_2 = '0x06012c8cf97bead5deae237070f9587f8e7a266d';
const CHAIN_ID_MOCK = '0x1';
const ERC_721_COLLECTION_1_MOCK = {
  id: ERC_721_ADDRESS_1,
  name: 'Erc 721 1',
  slug: 'erc-721-1',
  symbol: 'ERC721-1',
  imageUrl: 'url',
};

const ERC_721_COLLECTION_2_MOCK = {
  id: ERC_721_ADDRESS_2,
  name: 'Erc 721 2',
  slug: 'erc-721-2',
  symbol: 'ERC721-2',
  imageUrl: 'url',
};

describe('useNftCollectionsMetadata', () => {
  const mockGetCurrentChainId = jest.mocked(getCurrentChainId);
  const mockFetchNftCollectionsMetadata = jest.mocked(
    fetchNftCollectionsMetadata,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetCurrentChainId.mockReturnValue(CHAIN_ID_MOCK);
    mockFetchNftCollectionsMetadata.mockResolvedValue({
      collections: [ERC_721_COLLECTION_1_MOCK, ERC_721_COLLECTION_2_MOCK],
    });
  });

  it('fetches collections metadata and returns the correct data structure', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useNftCollectionsMetadata([
        { value: ERC_721_ADDRESS_1 },
        { value: ERC_721_ADDRESS_2 },
      ]),
    );

    await waitForNextUpdate();

    expect(mockFetchNftCollectionsMetadata).toHaveBeenCalledTimes(1);
    expect(result.current).toStrictEqual({
      [ERC_721_ADDRESS_1.toLowerCase()]: ERC_721_COLLECTION_1_MOCK,
      [ERC_721_ADDRESS_2.toLowerCase()]: ERC_721_COLLECTION_2_MOCK,
    });
  });

  it('does not fetch collections metadata if there are no contracts to fetch', async () => {
    renderHook(() => useNftCollectionsMetadata([]));

    expect(mockFetchNftCollectionsMetadata).not.toHaveBeenCalled();
  });

  it('does memoise result for same requests', async () => {
    const { waitForNextUpdate, rerender } = renderHook(() =>
      useNftCollectionsMetadata([
        { value: ERC_721_ADDRESS_1 },
        { value: ERC_721_ADDRESS_2 },
      ]),
    );

    await waitForNextUpdate();
    rerender();

    expect(mockFetchNftCollectionsMetadata).toHaveBeenCalledTimes(1);
  });
});
