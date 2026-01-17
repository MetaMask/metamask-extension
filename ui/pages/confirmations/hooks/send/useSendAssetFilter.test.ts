import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
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

  it('handles assets with non-string name and symbol properties', () => {
    const assetsWithNonStringProps: Asset[] = [
      // @ts-expect-error Testing runtime type mismatch
      { name: 123, symbol: 'VALID', chainId: '1' },
      // @ts-expect-error Testing runtime type mismatch
      { name: 'Test Token', symbol: { value: 'TEST' }, chainId: '1' },
      // @ts-expect-error Testing runtime type mismatch
      { name: null, symbol: null, chainId: '1' },
      { name: 'Valid Token', symbol: 'VALID', chainId: '1' },
    ];

    const { result } = renderHookWithProvider(
      () =>
        useSendAssetFilter({
          tokens: assetsWithNonStringProps,
          nfts: [],
          selectedChainId: null,
          searchQuery: 'valid',
        }),
      mockState,
    );

    // Should match tokens where EITHER name OR symbol is a valid string containing 'valid'
    // Token 0: name=123 (not string, ignored), symbol='VALID' (matches) - INCLUDED
    // Token 1: name='Test Token' (no match), symbol={object} (not string, ignored) - EXCLUDED
    // Token 2: name=null (ignored), symbol=null (ignored) - EXCLUDED
    // Token 3: name='Valid Token' (matches), symbol='VALID' (matches) - INCLUDED
    expect(result.current.filteredTokens).toEqual([
      assetsWithNonStringProps[0],
      assetsWithNonStringProps[3],
    ]);
    expect(result.current.filteredNfts).toEqual([]);
  });

  it('handles NFTs with non-string collection name properties', () => {
    const nftsWithNonStringCollectionName: Asset[] = [
      // @ts-expect-error Testing runtime type mismatch
      { name: 'NFT 1', collection: { name: 123 }, chainId: '1' },
      // @ts-expect-error Testing runtime type mismatch
      { name: 'NFT 2', collection: { name: null }, chainId: '1' },
      {
        name: 'Valid NFT',
        collection: { name: 'Test Collection' },
        chainId: '1',
      },
    ];

    const { result } = renderHookWithProvider(
      () =>
        useSendAssetFilter({
          tokens: [],
          nfts: nftsWithNonStringCollectionName,
          selectedChainId: null,
          searchQuery: 'test',
        }),
      mockState,
    );

    // Should only match the valid NFT with string collection name
    expect(result.current.filteredNfts).toEqual([
      nftsWithNonStringCollectionName[2],
    ]);
  });
});
