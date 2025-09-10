import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import { useSendAssets } from '../../../hooks/send/useSendAssets';
import { useSendAssetFilter } from '../../../hooks/send/useSendAssetFilter';
import { Asset } from './asset';

jest.mock('../../../hooks/send/useSendAssets');
jest.mock('../../../hooks/send/useSendAssetFilter');
jest.mock('../header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));
jest.mock('../asset-filter-input', () => ({
  AssetFilterInput: ({
    searchQuery,
    onChange,
  }: {
    searchQuery: string;
    onChange: (value: string) => void;
  }) => (
    <input
      data-testid="asset-filter-input"
      value={searchQuery}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));
jest.mock('../network-filter', () => ({
  NetworkFilter: ({
    selectedChainId,
    onChainIdChange,
  }: {
    selectedChainId: string | null;
    onChainIdChange: (chainId: string | null) => void;
  }) => (
    <select
      data-testid="network-filter"
      value={selectedChainId || ''}
      onChange={(e) => onChainIdChange(e.target.value || null)}
    >
      <option value="">All Networks</option>
      <option value="1">Ethereum</option>
    </select>
  ),
}));
jest.mock('../asset-list', () => ({
  AssetList: ({ onClearFilters }: { onClearFilters: () => void }) => (
    <div data-testid="asset-list">
      <button onClick={onClearFilters}>Clear Filters</button>
    </div>
  ),
}));

describe('Asset', () => {
  const mockUseSendAssets = jest.mocked(useSendAssets);
  const mockUseSendAssetFilter = jest.mocked(useSendAssetFilter);

  const mockTokens = [
    { name: 'Ethereum', symbol: 'ETH', chainId: '1' },
    { name: 'USDC', symbol: 'USDC', chainId: '1' },
  ];

  const mockNfts = [
    { name: 'Cool NFT', collection: { name: 'Cool Collection' }, chainId: '1' },
  ];

  const mockFilteredTokens = [mockTokens[0]];
  const mockFilteredNfts = [mockNfts[0]];

  beforeEach(() => {
    mockUseSendAssets.mockReturnValue({
      tokens: mockTokens,
      nfts: mockNfts,
    });

    mockUseSendAssetFilter.mockReturnValue({
      filteredTokens: mockFilteredTokens,
      filteredNfts: mockFilteredNfts,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all components', () => {
    const { getByTestId } = render(<Asset />);
    expect(getByTestId('asset-filter-input')).toBeInTheDocument();
    expect(getByTestId('network-filter')).toBeInTheDocument();
    expect(getByTestId('asset-list')).toBeInTheDocument();
  });

  it('updates search query when input changes', () => {
    const { getByTestId } = render(<Asset />);
    const input = getByTestId('asset-filter-input');

    fireEvent.change(input, { target: { value: 'test query' } });

    expect(mockUseSendAssetFilter).toHaveBeenCalledWith({
      tokens: mockTokens,
      nfts: mockNfts,
      selectedChainId: null,
      searchQuery: 'test query',
    });
  });

  it('updates selected chain when network filter changes', () => {
    const { getByTestId } = render(<Asset />);
    const select = getByTestId('network-filter');

    fireEvent.change(select, { target: { value: '1' } });

    expect(mockUseSendAssetFilter).toHaveBeenCalledWith({
      tokens: mockTokens,
      nfts: mockNfts,
      selectedChainId: '1',
      searchQuery: '',
    });
  });

  it('clears filters when clear button is clicked', () => {
    const { getByTestId, getByText } = render(<Asset />);
    const input = getByTestId('asset-filter-input');
    const select = getByTestId('network-filter');

    fireEvent.change(input, { target: { value: 'search' } });
    fireEvent.change(select, { target: { value: '1' } });
    fireEvent.click(getByText('Clear Filters'));

    expect(mockUseSendAssetFilter).toHaveBeenLastCalledWith({
      tokens: mockTokens,
      nfts: mockNfts,
      selectedChainId: null,
      searchQuery: '',
    });
  });

  it('passes correct props to AssetList', () => {
    render(<Asset />);

    expect(mockUseSendAssetFilter).toHaveBeenCalledWith({
      tokens: mockTokens,
      nfts: mockNfts,
      selectedChainId: null,
      searchQuery: '',
    });
  });
});
