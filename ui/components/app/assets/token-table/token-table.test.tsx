import React from 'react';
import { it } from '@jest/globals';
import { act, fireEvent } from '@testing-library/react';
import type { Asset } from '@metamask/assets-controllers';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { useTokenListData } from '../hooks/useTokenListData';
import type { TokenWithFiatAmount } from '../types';
import { useMoneyTokenListCta } from '../../../../hooks/money/useMoneyTokenListCta';
import { MONEY_TOKEN_LIST_CTA_TEST_ID } from '../../money/money-token-list-cta';
import { sortTokenAssets } from '../util/sortAssetsWithPriority';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsTokenSortLocation,
  MetaMetricsTokenSortPreference,
  MetaMetricsUserTrait,
} from '../../../../../shared/constants/metametrics';
import { TokenTable } from './token-table';

jest.mock('../../../../hooks/useAnalytics', () => {
  const mockTrackEvent = jest.fn();

  return {
    useAnalytics: () => ({
      createEventBuilder: jest.requireActual(
        '../../../../../shared/lib/analytics/create-event-builder',
      ).createEventBuilder,
      trackEvent: mockTrackEvent,
    }),
    mockTrackEvent,
  };
});

const getMockTrackEvent = () =>
  jest.requireMock('../../../../hooks/useAnalytics')
    .mockTrackEvent as jest.Mock;

jest.mock('../../../../hooks/money/useMoneyTokenListCta', () => ({
  useMoneyTokenListCta: jest.fn(() => undefined),
}));

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
  beforeEach(() => {
    jest.mocked(useMoneyTokenListCta).mockReturnValue(undefined);
  });

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

  it('resolves the Money CTA once for the displayed tokens', () => {
    const displayedTokens = [createToken('USDC'), createToken('ETH')];
    mockTokenListData({
      tokenListItems: displayedTokens.map((token) => ({
        type: 'token',
        token,
      })),
      displayedTokens,
    });

    renderTable();

    expect(useMoneyTokenListCta).toHaveBeenCalledWith(displayedTokens);
  });

  it('replaces the 24h change with the Money CTA for an eligible token', () => {
    const eligible = createToken('USDC');
    const other = createToken('ETH');
    const onCtaClick = jest.fn();
    const onRowClick = jest.fn();
    jest.mocked(useMoneyTokenListCta).mockReturnValue({
      label: 'Get 5% APY',
      isLoading: false,
      shouldShow: (token) => token.symbol === eligible.symbol,
      onClick: onCtaClick,
    });
    mockTokenListData({
      tokenListItems: [
        { type: 'token', token: eligible },
        { type: 'token', token: other },
      ],
      displayedTokens: [eligible, other],
      getTokenClickHandler: () => onRowClick,
    });

    const { getByRole, getAllByTestId } = renderTable();
    const cta = getByRole('button', { name: 'Get 5% APY' });

    expect(cta).toHaveAttribute(
      'data-testid',
      `${MONEY_TOKEN_LIST_CTA_TEST_ID}-${eligible.chainId}-${eligible.address}`,
    );
    expect(getAllByTestId('token-percent-change')).toHaveLength(1);

    fireEvent.click(cta);

    expect(onCtaClick).toHaveBeenCalledWith(eligible);
    expect(onRowClick).not.toHaveBeenCalled();
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

  const headerSortCases = [
    {
      column: 'balance',
      label: 'Balance',
      preference: MetaMetricsTokenSortPreference.TokenFiatAmount,
      first: { direction: 'up', reversed: true, name: 'sorted ascending' },
      second: { direction: 'down', reversed: false, name: 'sorted descending' },
    },
    {
      column: 'token',
      label: 'Token',
      preference: MetaMetricsTokenSortPreference.Title,
      first: { direction: 'down', reversed: false, name: 'sorted ascending' },
      second: { direction: 'up', reversed: true, name: 'sorted descending' },
    },
    {
      column: 'price',
      label: 'Price',
      preference: MetaMetricsTokenSortPreference.Price,
      first: { direction: 'down', reversed: false, name: 'sorted descending' },
      second: { direction: 'up', reversed: true, name: 'sorted ascending' },
    },
    {
      column: 'change',
      label: '24h change',
      preference: MetaMetricsTokenSortPreference.PercentChange,
      first: { direction: 'down', reversed: false, name: 'sorted descending' },
      second: { direction: 'up', reversed: true, name: 'sorted ascending' },
    },
  ] as const;

  it.each(headerSortCases)(
    'toggles the $label header sort',
    ({ column, label, preference, first, second }) => {
      getMockTrackEvent().mockClear();
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

      const sortEvent = expect.objectContaining({
        name: MetaMetricsEventName.TokenSortPreference,
        properties: {
          category: MetaMetricsEventCategory.Settings,
          [MetaMetricsUserTrait.TokenSortPreference]: preference,
          location: MetaMetricsTokenSortLocation.TokenColumnHeader,
        },
        sensitiveProperties: {},
      });
      expect(getMockTrackEvent()).toHaveBeenNthCalledWith(1, sortEvent);
      expect(getMockTrackEvent()).toHaveBeenNthCalledWith(2, sortEvent);
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
