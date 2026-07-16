import React from 'react';
import { render, screen } from '@testing-library/react';
import { ActivityList } from './activity-list';

const mockUseTransactionsQuery = jest.fn();

jest.mock('./useTransactionsQuery', () => ({
  useTransactionsQuery: (...args: unknown[]) =>
    mockUseTransactionsQuery(...args),
}));

jest.mock('./useLocalTransactions', () => ({
  useLocalTransactions: () => [],
}));

jest.mock('./useNonEvmTransactions', () => ({
  useNonEvmTransactions: () => [],
}));

jest.mock('./useActivityScreenOpened', () => ({
  useActivityScreenOpened: jest.fn(),
}));

jest.mock('../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: jest.fn(),
    createEventBuilder: jest.requireActual(
      '../../../shared/lib/analytics/create-event-builder',
    ).createEventBuilder,
  }),
}));

jest.mock('../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatMediumDate: (date: Date) => date.toISOString(),
  }),
}));

jest.mock(
  '../../components/app/assets/asset-list/asset-list-control-bar/asset-list-control-bar',
  () => () => null,
);

jest.mock(
  '../../components/app/pending-transaction-action-buttons/pending-transaction-cancel-speed-up-provider',
  () => ({
    PendingTransactionCancelSpeedUpProvider: ({
      children,
    }: {
      children: React.ReactNode;
    }) => children,
  }),
);

jest.mock('../../components/app/transaction-activity-empty-state', () => ({
  TransactionActivityEmptyState: () => (
    <div data-testid="activity-empty-state">empty</div>
  ),
}));

describe('ActivityList', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows the activity list skeleton while loading', () => {
    mockUseTransactionsQuery.mockReturnValue({
      data: undefined,
      isInitialLoading: true,
      fetchNextVisiblePage: jest.fn(),
    });

    render(<ActivityList />);
    expect(screen.getByTestId('activity-list-skeleton')).toBeInTheDocument();
  });

  it('does not show the activity list skeleton when not loading', () => {
    mockUseTransactionsQuery.mockReturnValue({
      data: { pages: [] },
      isInitialLoading: false,
      fetchNextVisiblePage: jest.fn(),
    });

    render(<ActivityList />);
    expect(
      screen.queryByTestId('activity-list-skeleton'),
    ).not.toBeInTheDocument();
  });

  it('pops the details history entry when unmounted while on a tx details hash', () => {
    mockUseTransactionsQuery.mockReturnValue({
      data: { pages: [] },
      isInitialLoading: false,
      fetchNextVisiblePage: jest.fn(),
    });

    const backSpy = jest
      .spyOn(window.history, 'back')
      .mockImplementation(() => undefined);
    window.history.pushState(null, '', '#/tx/eip155:1/0xabc');

    const { unmount } = render(<ActivityList />);
    unmount();

    expect(backSpy).toHaveBeenCalledTimes(1);
    backSpy.mockRestore();
  });

  it('does not pop history when unmounted off a tx details hash', () => {
    mockUseTransactionsQuery.mockReturnValue({
      data: { pages: [] },
      isInitialLoading: false,
      fetchNextVisiblePage: jest.fn(),
    });

    const backSpy = jest
      .spyOn(window.history, 'back')
      .mockImplementation(() => undefined);
    window.history.pushState(null, '', '#/activity');

    const { unmount } = render(<ActivityList />);
    unmount();

    expect(backSpy).not.toHaveBeenCalled();
    backSpy.mockRestore();
  });
});
