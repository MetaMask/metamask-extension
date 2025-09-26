import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { type Asset } from '../../types/send';
import { useSendAssetFilter } from './useSendAssetFilter';

describe('useSendAssetFilter', () => {
  const mockTokens: Asset[] = [
    {
      name: 'Ethereum',
      symbol: 'ETH',
      chainId: '1',
    },
    {
      name: 'USD Coin',
      symbol: 'USDC',
      chainId: '1',
    },
    {
      name: 'Polygon',
      symbol: 'MATIC',
      chainId: '137',
    },
  ];

  const mockNfts: Asset[] = [
    {
      name: 'CryptoPunk #1',
      collection: { name: 'CryptoPunks' },
      chainId: '1',
    },
    {
      name: 'Bored Ape #100',
      collection: { name: 'Bored Ape Yacht Club' },
      chainId: '1',
    },
    {
      name: 'Cool Cat #200',
      collection: { name: 'Cool Cats' },
      chainId: '137',
    },
  ];

  it('returns all assets when selectedChainId is null', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendAssetFilter({
          tokens: mockTokens,
          nfts: mockNfts,
          selectedChainId: null,
          searchQuery: '',
        }),
      mockState,
    );

    expect(result.current.filteredTokens).toEqual(mockTokens);
    expect(result.current.filteredNfts).toEqual(mockNfts);
  });

  it('filters assets by specific chainId', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendAssetFilter({
          tokens: mockTokens,
          nfts: mockNfts,
          selectedChainId: '1',
          searchQuery: '',
        }),
      mockState,
    );

    expect(result.current.filteredTokens).toEqual([
      mockTokens[0],
      mockTokens[1],
    ]);
    expect(result.current.filteredNfts).toEqual([mockNfts[0], mockNfts[1]]);
  });

  it('returns empty arrays when no assets match chainId', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendAssetFilter({
          tokens: mockTokens,
          nfts: mockNfts,
          selectedChainId: '999',
          searchQuery: '',
        }),
      mockState,
    );

    expect(result.current.filteredTokens).toEqual([]);
    expect(result.current.filteredNfts).toEqual([]);
  });

  it('filters assets by search query matching asset name', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendAssetFilter({
          tokens: mockTokens,
          nfts: mockNfts,
          selectedChainId: null,
          searchQuery: 'ethereum',
        }),
      mockState,
    );

    expect(result.current.filteredTokens).toEqual([mockTokens[0]]);
    expect(result.current.filteredNfts).toEqual([]);
  });

  it('filters assets by search query matching asset symbol', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendAssetFilter({
          tokens: mockTokens,
          nfts: mockNfts,
          selectedChainId: null,
          searchQuery: 'USDC',
        }),
      mockState,
    );

    expect(result.current.filteredTokens).toEqual([mockTokens[1]]);
    expect(result.current.filteredNfts).toEqual([]);
  });

  it('filters NFTs by search query matching collection name', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendAssetFilter({
          tokens: mockTokens,
          nfts: mockNfts,
          selectedChainId: null,
          searchQuery: 'cryptopunks',
        }),
      mockState,
    );

    expect(result.current.filteredTokens).toEqual([]);
    expect(result.current.filteredNfts).toEqual([mockNfts[0]]);
  });

  it('performs case insensitive search', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendAssetFilter({
          tokens: mockTokens,
          nfts: mockNfts,
          selectedChainId: null,
          searchQuery: 'USD',
        }),
      mockState,
    );

    expect(result.current.filteredTokens).toEqual([mockTokens[1]]);
  });

  it('returns all assets when search query is empty string', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendAssetFilter({
          tokens: mockTokens,
          nfts: mockNfts,
          selectedChainId: null,
          searchQuery: '',
        }),
      mockState,
    );

    expect(result.current.filteredTokens).toEqual(mockTokens);
    expect(result.current.filteredNfts).toEqual(mockNfts);
  });

  it('returns all assets when search query is only whitespace', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendAssetFilter({
          tokens: mockTokens,
          nfts: mockNfts,
          selectedChainId: null,
          searchQuery: '   ',
        }),
      mockState,
    );

    expect(result.current.filteredTokens).toEqual(mockTokens);
    expect(result.current.filteredNfts).toEqual(mockNfts);
  });

  it('returns empty arrays when no assets match search query', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendAssetFilter({
          tokens: mockTokens,
          nfts: mockNfts,
          selectedChainId: null,
          searchQuery: 'nonexistent',
        }),
      mockState,
    );

    expect(result.current.filteredTokens).toEqual([]);
    expect(result.current.filteredNfts).toEqual([]);
  });

  it('combines network and search filtering', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendAssetFilter({
          tokens: mockTokens,
          nfts: mockNfts,
          selectedChainId: '1',
          searchQuery: 'USD',
        }),
      mockState,
    );

    expect(result.current.filteredTokens).toEqual([mockTokens[1]]);
    expect(result.current.filteredNfts).toEqual([]);
  });

  it('handles empty token and NFT arrays', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendAssetFilter({
          tokens: [],
          nfts: [],
          selectedChainId: '1',
          searchQuery: 'test',
        }),
      mockState,
    );

    expect(result.current.filteredTokens).toEqual([]);
    expect(result.current.filteredNfts).toEqual([]);
  });

  it('handles assets with undefined name and symbol properties', () => {
    const assetsWithUndefinedProps: Asset[] = [
      { chainId: '1' },
      { name: undefined, symbol: undefined, chainId: '1' },
    ];

    const { result } = renderHookWithProvider(
      () =>
        useSendAssetFilter({
          tokens: assetsWithUndefinedProps,
          nfts: [],
          selectedChainId: null,
          searchQuery: 'test',
        }),
      mockState,
    );

    expect(result.current.filteredTokens).toEqual([]);
    expect(result.current.filteredNfts).toEqual([]);
  });

  it('handles NFTs with undefined collection properties', () => {
    const nftsWithUndefinedCollection: Asset[] = [
      { name: 'Test NFT', chainId: '1' },
      { name: 'Another NFT', collection: undefined, chainId: '1' },
      { name: 'NFT with empty collection', collection: {}, chainId: '1' },
    ];

    const { result } = renderHookWithProvider(
      () =>
        useSendAssetFilter({
          tokens: [],
          nfts: nftsWithUndefinedCollection,
          selectedChainId: null,
          searchQuery: 'test',
        }),
      mockState,
    );

    expect(result.current.filteredNfts).toEqual([
      nftsWithUndefinedCollection[0],
    ]);
  });

  it('trims whitespace from search query', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendAssetFilter({
          tokens: mockTokens,
          nfts: mockNfts,
          selectedChainId: null,
          searchQuery: '  ethereum  ',
        }),
      mockState,
    );

    expect(result.current.filteredTokens).toEqual([mockTokens[0]]);
  });

  it('uses undefined as default searchQuery when not provided', () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendAssetFilter({
          tokens: mockTokens,
          nfts: mockNfts,
          selectedChainId: null,
        }),
      mockState,
    );

    expect(result.current.filteredTokens).toEqual(mockTokens);
    expect(result.current.filteredNfts).toEqual(mockNfts);
  });
});
