import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import TokenSearch from './token-search.component';

const MOCK_TOKEN_LIST = {
  '0x1': {
    data: {
      '0xaaa': {
        address: '0xaaa',
        symbol: 'AAA',
        name: 'Token AAA',
        decimals: 18,
      },
      '0xbbb': {
        address: '0xbbb',
        symbol: 'BBB',
        name: 'Token BBB',
        decimals: 18,
      },
    },
  },
  '0x89': {
    data: {
      '0xccc': {
        address: '0xccc',
        symbol: 'CCC',
        name: 'Token CCC',
        decimals: 18,
      },
    },
  },
};

describe('TokenSearch', () => {
  const defaultProps = {
    onSearch: jest.fn(),
    tokenList: MOCK_TOKEN_LIST,
    searchClassName: 'token-search-class',
    networkFilter: { '0x1': true },
    setSearchResults: jest.fn(),
    chainId: '0x1',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the search field', () => {
    renderWithProvider(<TokenSearch {...defaultProps} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('calls onSearch when user types a query', () => {
    renderWithProvider(<TokenSearch {...defaultProps} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'AAA' } });
    expect(defaultProps.onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        newSearchQuery: 'AAA',
        results: expect.any(Array),
      }),
    );
  });

  it('clears search when clear callback is invoked', () => {
    renderWithProvider(<TokenSearch {...defaultProps} />);
    const input = screen.getByRole('searchbox');

    // Type something first
    fireEvent.change(input, { target: { value: 'AAA' } });
    expect(input.value).toBe('AAA');

    // Click clear button
    const clearButton = screen.getByLabelText('Clear');
    fireEvent.click(clearButton);

    expect(input.value).toBe('');
    expect(defaultProps.setSearchResults).toHaveBeenCalledWith([]);
  });

  it('calls clear when network filter changes', () => {
    const { rerender } = renderWithProvider(<TokenSearch {...defaultProps} />);
    const input = screen.getByRole('searchbox');

    // Type something
    fireEvent.change(input, { target: { value: 'AAA' } });
    expect(input.value).toBe('AAA');

    // Change network filter (triggers clear via useEffect)
    rerender(
      <TokenSearch
        {...defaultProps}
        networkFilter={{ '0x1': true, '0x89': true }}
      />,
    );

    expect(defaultProps.setSearchResults).toHaveBeenCalledWith([]);
  });

  it('filters tokenList for multi-network when networkFilter has multiple keys', () => {
    const multiNetworkProps = {
      ...defaultProps,
      networkFilter: { '0x1': true, '0x89': true },
    };

    renderWithProvider(<TokenSearch {...multiNetworkProps} />);

    // Search for a token available on the second network
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'CCC' } });

    expect(defaultProps.onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        newSearchQuery: 'CCC',
        results: expect.any(Array),
      }),
    );
  });

  it('returns exact address match results', () => {
    renderWithProvider(<TokenSearch {...defaultProps} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: '0xaaa' } });

    expect(defaultProps.onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        newSearchQuery: '0xaaa',
        results: expect.arrayContaining([
          expect.objectContaining({ address: '0xaaa' }),
        ]),
      }),
    );
  });
});
