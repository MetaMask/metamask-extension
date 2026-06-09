import React from 'react';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import * as tokenSearchApi from '../../../../../shared/lib/token-search/token-search-api';
import TokenSearch from './token-search.component';

jest.mock('../../../../../shared/lib/token-search/token-search-api');

const mockSearchTokens = jest.mocked(tokenSearchApi.searchTokens);

const emptyResponse = {
  data: [],
  count: 0,
  totalCount: 0,
  pageInfo: { hasNextPage: false, endCursor: '' },
};

const MOCK_AAA = {
  assetId: 'eip155:1/erc20:0xaaa',
  symbol: 'AAA',
  name: 'Token AAA',
  decimals: 18,
  iconUrl: '',
};

const MOCK_CCC = {
  assetId: 'eip155:137/erc20:0xccc',
  symbol: 'CCC',
  name: 'Token CCC',
  decimals: 18,
  iconUrl: '',
};

describe('TokenSearch', () => {
  const defaultProps = {
    onSearch: jest.fn(),
    searchClassName: 'token-search-class',
    networkFilter: { '0x1': true },
    setSearchResults: jest.fn(),
    chainId: '0x1',
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockSearchTokens.mockResolvedValue(emptyResponse);
  });

  afterEach(async () => {
    // Flush any pending debounce timers inside act so React does not emit
    // "state update outside of act" warnings.
    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders the search field', () => {
    renderWithProvider(<TokenSearch {...defaultProps} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('calls onSearch when user types a query', async () => {
    mockSearchTokens.mockResolvedValue({
      ...emptyResponse,
      data: [MOCK_AAA],
      count: 1,
      totalCount: 1,
    });

    renderWithProvider(<TokenSearch {...defaultProps} />);
    const input = screen.getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'AAA' } });

    // Flush the 300 ms debounce, then flush the resolved promise.
    await act(async () => {
      jest.advanceTimersByTime(400);
      await Promise.resolve();
    });

    expect(defaultProps.onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        newSearchQuery: 'AAA',
        results: expect.any(Array),
      }),
    );
  });

  it('clears search when clear callback is invoked', async () => {
    renderWithProvider(<TokenSearch {...defaultProps} />);
    const input = screen.getByRole('searchbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'AAA' } });
    expect(input.value).toBe('AAA');

    const clearButton = screen.getByLabelText(messages.clear.message);
    fireEvent.click(clearButton);

    expect(input.value).toBe('');
    expect(defaultProps.setSearchResults).toHaveBeenCalledWith([]);
  });

  it('calls clear when network filter changes', async () => {
    const { rerender } = renderWithProvider(<TokenSearch {...defaultProps} />);
    const input = screen.getByRole('searchbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'AAA' } });
    expect(input.value).toBe('AAA');

    rerender(
      <TokenSearch
        {...defaultProps}
        networkFilter={{ '0x1': true, '0x89': true }}
      />,
    );

    expect(defaultProps.setSearchResults).toHaveBeenCalledWith([]);
  });

  it('filters tokenList for multi-network when networkFilter has multiple keys', async () => {
    mockSearchTokens.mockResolvedValue({
      ...emptyResponse,
      data: [MOCK_CCC],
      count: 1,
      totalCount: 1,
    });

    const multiNetworkProps = {
      ...defaultProps,
      networkFilter: { '0x1': true, '0x89': true },
    };

    renderWithProvider(<TokenSearch {...multiNetworkProps} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'CCC' } });

    await act(async () => {
      jest.advanceTimersByTime(400);
      await Promise.resolve();
    });

    expect(defaultProps.onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        newSearchQuery: 'CCC',
        results: expect.any(Array),
      }),
    );
  });

  it('returns exact address match results', async () => {
    mockSearchTokens.mockResolvedValue({
      ...emptyResponse,
      data: [MOCK_AAA],
      count: 1,
      totalCount: 1,
    });

    renderWithProvider(<TokenSearch {...defaultProps} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: '0xaaa' } });

    await act(async () => {
      jest.advanceTimersByTime(400);
      await Promise.resolve();
    });

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
