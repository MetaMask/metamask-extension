import React from 'react';
import { fireEvent } from '@testing-library/react';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { useTokenListData } from '../hooks/useTokenListData';
import type { TokenWithFiatAmount } from '../types';
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

const renderTable = () =>
  renderWithProvider(
    <TokenTable onTokenClick={jest.fn()} />,
    configureStore({ metamask: mockState.metamask }),
  );

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
    expect(getByText('ETH')).toBeInTheDocument();
    expect(getByText('USDC')).toBeInTheDocument();
  });

  it('stacks the 24h change under price below @2xl and splits them into columns at @2xl', () => {
    mockTokenListData({
      tokenListItems: [{ type: 'token', token: createToken('ETH') }],
    });

    const { getByTestId, getByText, getAllByTestId } = renderTable();

    expect(getByTestId('token-table')).toHaveClass('@container/token-table');

    const header = getByTestId('token-table-header');
    expect(header).toHaveClass(
      'grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))]',
      '@2xl/token-table:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]',
    );

    const priceHeader = getByText('Price');
    expect(priceHeader).toHaveClass('text-end');
    expect(priceHeader).not.toHaveClass('hidden');

    const changeHeader = getByText('24h change');
    expect(changeHeader).toHaveClass(
      'hidden',
      '@2xl/token-table:block',
      'text-end',
    );

    const balanceHeader = getByText('Balance');
    expect(balanceHeader).toHaveClass('text-end');

    const row = getByTestId('multichain-token-list-button');
    expect(row).toHaveStyle({ height: '62px' });
    expect(row).toHaveClass(
      'grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))]',
      '@2xl/token-table:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]',
    );

    const priceCell = getByTestId('token-price').parentElement;
    expect(priceCell).toHaveClass('flex', 'flex-col', 'items-end');
    expect(priceCell).not.toHaveClass('hidden');

    const percentChanges = getAllByTestId('token-percent-change');
    const stackedPercent = percentChanges.find((node) =>
      node.parentElement?.classList.contains('@2xl/token-table:hidden'),
    );
    const columnPercent = percentChanges.find((node) =>
      node.parentElement?.classList.contains('@2xl/token-table:flex'),
    );

    expect(percentChanges).toHaveLength(2);
    expect(stackedPercent).toBeDefined();
    expect(columnPercent).toBeDefined();

    expect(stackedPercent?.parentElement).toHaveClass(
      '@2xl/token-table:hidden',
    );
    expect(stackedPercent?.parentElement).not.toHaveClass('hidden');
    expect(priceCell).toContainElement(stackedPercent as HTMLElement);

    expect(columnPercent?.parentElement).toHaveClass(
      'hidden',
      '@2xl/token-table:flex',
      '@2xl/token-table:justify-end',
    );
    expect(priceCell).not.toContainElement(columnPercent as HTMLElement);
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
});
