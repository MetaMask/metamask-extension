import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { render, screen } from '@testing-library/react';
import { ActivityList } from './activity-list';

const mockUseVirtualizer = jest.fn();
const mockUseTransactionsQuery = jest.fn();
const mockSelectLocalTransactions = jest.fn();

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (...args: unknown[]) => mockUseVirtualizer(...args),
}));

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../contexts/scroll-container', () => ({
  useScrollContainer: () => ({ current: null }),
}));

jest.mock('../../../selectors/activity', () => ({
  ...jest.requireActual('../../../selectors/activity'),
  selectLocalTransactions: (...args: unknown[]) =>
    mockSelectLocalTransactions(...args),
}));

jest.mock('./hooks', () => ({
  ...jest.requireActual('./hooks'),
  useTransactionsQuery: (...args: unknown[]) =>
    mockUseTransactionsQuery(...args),
}));

jest.mock('../../app/transaction-activity-empty-state', () => ({
  TransactionActivityEmptyState: () => (
    <div data-testid="activity-empty-state">empty</div>
  ),
}));

jest.mock(
  '../../app/assets/asset-list/asset-list-control-bar',
  () => () => null,
);

jest.mock('./activity-list-item', () => ({
  ActivityListItem: () => <div data-testid="evm-item">evm-item</div>,
}));

jest.mock('./non-evm-activity-list-item', () => ({
  NonEvmActivityListItem: () => (
    <div data-testid="non-evm-item">non-evm-item</div>
  ),
}));

jest.mock('./local-activity-list-item', () => ({
  LocalActivityListItem: () => <div data-testid="local-item">local-item</div>,
}));

const defaultVirtualizer = {
  getVirtualItems: () => [],
  getTotalSize: () => 0,
  measure: jest.fn(),
  measureElement: jest.fn(),
  options: { scrollMargin: 0 },
};

mockUseVirtualizer.mockReturnValue(defaultVirtualizer);

function createStore({
  nonEvmTransactions = {},
}: {
  nonEvmTransactions?: Record<
    string,
    Record<string, { transactions: unknown[] }>
  >;
} = {}) {
  return configureMockStore()({
    metamask: {
      accountTree: {
        selectedAccountGroup: 'entropy:01-group-1',
        wallets: {
          'entropy:01': {
            id: 'entropy:01',
            metadata: { name: 'Wallet 1' },
            groups: {
              'entropy:01-group-1': {
                id: 'entropy:01-group-1',
                type: 'multichainAccount',
                metadata: {},
                accounts: ['1'],
              },
            },
          },
        },
      },
      enabledNetworkMap: {
        eip155: { '0x1': true },
        solana: { 'solana:mainnet': true },
      },
      internalAccounts: {
        selectedAccount: '1',
        accounts: {
          '1': {
            address: '0x4f5243ceea96cee1da0fdb89c756d0e999439424',
            id: '1',
            scopes: ['eip155:1', 'solana:mainnet'],
            type: 'eip155:eoa',
          },
        },
      },
      multichainTransactions: {
        transactionsById: {},
        transactionsByAccount: {},
      },
      nonEvmTransactions,
      smartTransactionsState: { smartTransactions: {} },
      transactions: [],
    },
  });
}

describe('ActivityList', () => {
  const enableVisibleVirtualItems = () => {
    mockUseVirtualizer.mockImplementation(({ count }: { count: number }) => ({
      getVirtualItems: () =>
        Array.from({ length: count }, (_, index) => ({
          index,
          key: index,
          start: index * 70,
        })),
      getTotalSize: () => count * 70,
      options: { scrollMargin: 0 },
      measure: jest.fn(),
      measureElement: jest.fn(),
    }));
  };

  beforeEach(() => {
    mockSelectLocalTransactions.mockReturnValue([]);
    mockUseTransactionsQuery.mockReturnValue({
      data: { pages: [] },
      isInitialLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockUseVirtualizer.mockReturnValue(defaultVirtualizer);
  });

  it('renders empty state when there are no transactions', () => {
    const store = createStore();

    render(
      <Provider store={store}>
        <ActivityList />
      </Provider>,
    );

    expect(screen.getByTestId('activity-empty-state')).toBeInTheDocument();
  });

  it('renders one evm and one non-evm item when both exist', () => {
    const evmTx = {
      chainId: 'eip155:1',
      id: 'evm-1',
      timestamp: 1735689600000,
      transactionCategory: 'STANDARD',
      transactionType: 'STANDARD',
      txParams: { from: '0x4f5243ceea96cee1da0fdb89c756d0e999439424' },
    };
    const nonEvmTx = {
      chain: 'solana:mainnet',
      id: 'non-evm-1',
      timestamp: 1735689601000,
    };

    mockUseTransactionsQuery.mockReturnValue({
      data: { pages: [{ data: [evmTx] }] },
      isInitialLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    enableVisibleVirtualItems();

    const store = createStore({
      nonEvmTransactions: {
        '1': {
          'solana:mainnet': {
            transactions: [nonEvmTx],
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <ActivityList />
      </Provider>,
    );

    expect(screen.getByTestId('evm-item')).toBeInTheDocument();
    expect(screen.getByTestId('non-evm-item')).toBeInTheDocument();
  });

  it('applies tokenAddress filter and shows empty state when no transaction matches', () => {
    const evmTx = {
      amounts: {
        from: {
          amount: '1',
          token: {
            address: '0x111',
            chainId: '0x1',
            decimals: 18,
            symbol: 'A',
          },
        },
      },
      chainId: 'eip155:1',
      id: 'evm-token-miss',
      timestamp: 1735689600000,
      transactionCategory: 'STANDARD',
      transactionType: 'STANDARD',
      txParams: { from: '0x4f5243ceea96cee1da0fdb89c756d0e999439424' },
    };

    mockUseTransactionsQuery.mockReturnValue({
      data: { pages: [{ data: [evmTx] }] },
      isInitialLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    const store = createStore();

    render(
      <Provider store={store}>
        <ActivityList filter={{ tokenAddress: '0x222' }} />
      </Provider>,
    );

    expect(screen.getByTestId('activity-empty-state')).toBeInTheDocument();
  });

  it('applies chainId filter and excludes non-evm rows for eip155 chain', () => {
    const evmTx = {
      chainId: 'eip155:1',
      id: 'evm-only',
      timestamp: 1735689600000,
      transactionCategory: 'STANDARD',
      transactionType: 'STANDARD',
      txParams: { from: '0x4f5243ceea96cee1da0fdb89c756d0e999439424' },
    };
    const nonEvmTx = {
      chain: 'solana:mainnet',
      id: 'non-evm-filtered-out',
      timestamp: 1735689601000,
    };

    mockUseTransactionsQuery.mockReturnValue({
      data: { pages: [{ data: [evmTx] }] },
      isInitialLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });
    enableVisibleVirtualItems();

    const store = createStore({
      nonEvmTransactions: {
        '1': {
          'solana:mainnet': {
            transactions: [nonEvmTx],
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <ActivityList filter={{ chainId: 'eip155:1' }} />
      </Provider>,
    );

    expect(screen.getByTestId('evm-item')).toBeInTheDocument();
    expect(screen.queryByTestId('non-evm-item')).not.toBeInTheDocument();
  });

  it('renders local item type when local transaction groups are present', () => {
    mockSelectLocalTransactions.mockReturnValue([
      {
        initialTransaction: {
          chainId: '0x1',
          txParams: { to: '0xabc' },
        },
        primaryTransaction: {
          id: 'local-1',
          status: 'submitted',
          time: 1735689600000,
          txParams: { nonce: '0x1' },
        },
      },
    ]);

    enableVisibleVirtualItems();
    const store = createStore();

    render(
      <Provider store={store}>
        <ActivityList />
      </Provider>,
    );

    expect(screen.getByTestId('local-item')).toBeInTheDocument();
  });
});
