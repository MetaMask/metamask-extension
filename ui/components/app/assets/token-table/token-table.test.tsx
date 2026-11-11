import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import type { Asset } from '@metamask/assets-controllers';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { useTokenListData } from '../hooks/useTokenListData';
import type { TokenWithFiatAmount } from '../types';
import { sortTokenAssets } from '../util/sortAssetsWithPriority';
import { TokenTable } from './token-table';

jest.mock('../hooks/useTokenListData', () => ({
  ...jest.requireActual('../hooks/useTokenListData'),
  useTokenListData: jest.fn(),
}));

jest.mock('../hooks', () => ({
  useTokenDisplayInfo: ({ token }: { token: TokenWithFiatAmount }) => ({
    title: token.title,
    tokenImage: '',
    tokenChainImage: '',
    secondary: null,
  }),
}));

jest.mock('../asset-list/cells/asset-cell-badge', () => ({
  AssetCellBadge: () => null,
}));

jest.mock('../token-cell/cells', () => ({
  TokenCellTitle: ({ token }: { token: { title: string } }) => (
    <span>{token.title}</span>
  ),
  TokenCellPercentChange: () => <span data-testid="token-percent-change" />,
  TokenCellPrice: () => <span data-testid="token-price" />,
  TokenCellPrimaryDisplay: () => null,
  TokenCellSecondaryDisplay: () => null,
}));

jest.mock('../token-list/token-list-loading-skeleton', () => ({
  TokenListLoadingSkeleton: () => <div data-testid="loading-skeleton" />,
}));

const mockUseTokenListData = jest.mocked(useTokenListData);

const createToken = (symbol: string): TokenWithFiatAmount =>
  ({
    chainId: '0x1',
    address: `0x${symbol}`,
    symbol,
    title: symbol,
    decimals: 18,
    image: '',
    secondary: null,
  }) as unknown as TokenWithFiatAmount;

const mockTokenListData = (
  overrides: Partial<ReturnType<typeof useTokenListData>> = {},
) => {
  mockUseTokenListData.mockReturnValue({
    tokenListItems: [],
    displayedTokens: [],
    showLoadingSkeleton: false,
    hasBalance: false,
    privacyMode: false,
    isLowValueAssetsExpanded: false,
    handleLowValueAssetsToggle: jest.fn(),
    getTokenClickHandler: () => undefined,
    ...overrides,
  });
};

const renderTable = () => {
  const store = configureStore({ metamask: mockState.metamask });

  return {
    store,
    ...renderWithProvider(<TokenTable onTokenClick={jest.fn()} />, store),
  };
};

const getSortIndicator = (header: HTMLElement) =>
  header.querySelector('[data-testid="token-table-sort-indicator"]');

describe('TokenTable', () => {
  it('renders the column headers and a row for each token', () => {
    mockTokenListData({
      tokenListItems: [
        { type: 'token', token: createToken('ETH') },
        { type: 'token', token: createToken('USDC') },
      ],
    });

    const { getByTestId, getAllByTestId, getByText } = renderTable();

    expect(getByTestId('token-table-header')).toBeInTheDocument();
    expect(getAllByTestId('multichain-token-list-button')).toHaveLength(2);
    expect(getAllByTestId('token-price')).toHaveLength(2);
    expect(getAllByTestId('token-percent-change')).toHaveLength(2);
    expect(getByText('ETH')).toBeInTheDocument();
    expect(getByText('USDC')).toBeInTheDocument();
  });

  it('renders the loading skeleton instead of the table while loading', () => {
    mockTokenListData({ showLoadingSkeleton: true });

    const { getByTestId, queryByTestId } = renderTable();

    expect(getByTestId('loading-skeleton')).toBeInTheDocument();
    expect(queryByTestId('token-table')).not.toBeInTheDocument();
  });

  it('calls the token click handler when a row is clicked', () => {
    const onClick = jest.fn();
    mockTokenListData({
      tokenListItems: [{ type: 'token', token: createToken('ETH') }],
      getTokenClickHandler: () => onClick,
    });

    const { getByTestId } = renderTable();
    fireEvent.click(getByTestId('multichain-token-list-button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders the low value assets toggle and calls its handler', () => {
    const handleLowValueAssetsToggle = jest.fn();
    mockTokenListData({
      tokenListItems: [
        { type: 'token', token: createToken('ETH') },
        { type: 'low-value-toggle', count: 3 },
      ],
      handleLowValueAssetsToggle,
    });

    const { getByTestId } = renderTable();
    fireEvent.click(getByTestId('low-value-assets-toggle'));

    expect(handleLowValueAssetsToggle).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      column: 'balance',
      label: 'Balance',
      first: { direction: 'up', reversed: true, name: 'sorted ascending' },
      second: { direction: 'down', reversed: false, name: 'sorted descending' },
    },
    {
      column: 'token',
      label: 'Token',
      first: { direction: 'down', reversed: false, name: 'sorted ascending' },
      second: { direction: 'up', reversed: true, name: 'sorted descending' },
    },
    {
      column: 'price',
      label: 'Price',
      first: { direction: 'down', reversed: false, name: 'sorted descending' },
      second: { direction: 'up', reversed: true, name: 'sorted ascending' },
    },
    {
      column: 'change',
      label: '24h change',
      first: { direction: 'down', reversed: false, name: 'sorted descending' },
      second: { direction: 'up', reversed: true, name: 'sorted ascending' },
    },
  ] as const)(
    'toggles the $label header sort',
    ({ column, label, first, second }) => {
      mockTokenListData();

      const { getByTestId } = renderTable();
      const header = () => getByTestId(`token-table-sort-${column}`);
      const sortOverride = (reversed: boolean) =>
        column === 'price' || column === 'change'
          ? expect.objectContaining({
              column,
              reversed,
              getValue: expect.any(Function),
            })
          : { column, reversed };

      fireEvent.click(header());

      expect(getSortIndicator(header())).toHaveAttribute(
        'data-sort-direction',
        first.direction,
      );
      expect(getSortIndicator(header())).toHaveAttribute('aria-hidden', 'true');
      expect(header()).toHaveAccessibleName(`${label}, ${first.name}`);
      if (column !== 'balance') {
        expect(
          getSortIndicator(getByTestId('token-table-sort-balance')),
        ).toBeNull();
      }
      expect(mockUseTokenListData).toHaveBeenLastCalledWith(
        expect.objectContaining({ sortOverride: sortOverride(first.reversed) }),
      );

      fireEvent.click(header());

      expect(getSortIndicator(header())).toHaveAttribute(
        'data-sort-direction',
        second.direction,
      );
      expect(header()).toHaveAccessibleName(`${label}, ${second.name}`);
      expect(mockUseTokenListData).toHaveBeenLastCalledWith(
        expect.objectContaining({
          sortOverride: sortOverride(second.reversed),
        }),
      );
    },
  );

  it('drops a header sort when the saved preference changes', () => {
    mockTokenListData();

    const { getByTestId, store } = renderTable();
    fireEvent.click(getByTestId('token-table-sort-price'));

    expect(mockUseTokenListData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sortOverride: expect.objectContaining({
          column: 'price',
          reversed: false,
          getValue: expect.any(Function),
        }),
      }),
    );

    const setSavedSort = (tokenSortConfig: {
      key: string;
      order: 'asc' | 'dsc';
      sortCallback: string;
    }) => {
      act(() => {
        store.dispatch({
          type: 'UPDATE_METAMASK_STATE',
          value: {
            preferences: {
              ...store.getState().metamask.preferences,
              tokenSortConfig,
            },
          },
        });
      });
    };

    setSavedSort({
      key: 'title',
      order: 'asc',
      sortCallback: 'alphaNumeric',
    });

    expect(
      getSortIndicator(getByTestId('token-table-sort-token')),
    ).toHaveAttribute('data-sort-direction', 'down');
    expect(getSortIndicator(getByTestId('token-table-sort-price'))).toBeNull();
    expect(mockUseTokenListData).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortOverride: null }),
    );

    setSavedSort({
      key: 'tokenFiatAmount',
      order: 'dsc',
      sortCallback: 'stringNumeric',
    });

    expect(
      getSortIndicator(getByTestId('token-table-sort-balance')),
    ).toHaveAttribute('data-sort-direction', 'down');
    expect(getSortIndicator(getByTestId('token-table-sort-price'))).toBeNull();
    expect(mockUseTokenListData).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortOverride: null }),
    );
  });

  it('renders rows in the order selected by the header', () => {
    const assets = [
      { name: 'Beta', symbol: 'BETA', fiat: { balance: 1 } },
      { name: 'Alpha', symbol: 'ALPHA', fiat: { balance: 5 } },
    ] as unknown as Asset[];
    const prices: Record<string, number> = { Alpha: 1, Beta: 10 };

    mockUseTokenListData.mockImplementation(({ sortOverride }) => {
      const override =
        sortOverride?.column === 'price' || sortOverride?.column === 'change'
          ? {
              ...sortOverride,
              getValue: (asset: Asset) => prices[asset.name],
            }
          : sortOverride;

      return {
        tokenListItems: sortTokenAssets(
          assets,
          {
            key: 'tokenFiatAmount',
            order: 'dsc',
            sortCallback: 'stringNumeric',
          },
          override,
        ).map((asset) => ({
          type: 'token' as const,
          token: createToken(asset.name),
        })),
        displayedTokens: [],
        showLoadingSkeleton: false,
        hasBalance: false,
        privacyMode: false,
        isLowValueAssetsExpanded: false,
        handleLowValueAssetsToggle: jest.fn(),
        getTokenClickHandler: () => undefined,
      };
    });

    const { getAllByTestId, getByTestId } = renderTable();
    const titles = () =>
      getAllByTestId('multichain-token-list-button').map(
        (row) => row.textContent,
      );

    expect(titles()).toEqual(['Alpha', 'Beta']);

    fireEvent.click(getByTestId('token-table-sort-price'));

    expect(titles()).toEqual(['Beta', 'Alpha']);
  });
});
