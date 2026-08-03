import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import { ScreenViewedEntryPoint } from '../../../shared/constants/metametrics';
import { ActivityList } from './activity-list';

const mockUseTransactionsQuery = jest.fn();
const mockUseActivityScreenViewed = jest.fn();
const mockUseLocalTransactions = jest.fn((): ActivityListItem[] => []);
const mockUseRampsOrderActivity = jest.fn((): ActivityListItem[] => []);

jest.mock('./useActivityScreenViewed', () => ({
  useActivityScreenViewed: (props: unknown) =>
    mockUseActivityScreenViewed(props),
}));

jest.mock('./useTransactionsQuery', () => ({
  useTransactionsQuery: (...args: unknown[]) =>
    mockUseTransactionsQuery(...args),
}));

jest.mock('./useLocalTransactions', () => ({
  useLocalTransactions: () => mockUseLocalTransactions(),
}));

jest.mock('./useNonEvmTransactions', () => ({
  useNonEvmTransactions: () => [],
}));

jest.mock('../../hooks/ramps/useRampsOrderActivity', () => ({
  useRampsOrderActivity: () => mockUseRampsOrderActivity(),
}));

jest.mock('./rows/activity-row', () => ({
  ActivityRow: ({
    data,
    onClick,
  }: {
    data: ActivityListItem;
    onClick: () => void;
  }) => (
    <button
      type="button"
      data-testid={`activity-row-${data.type}`}
      data-hash={data.hash}
      onClick={onClick}
    >
      {data.type}
    </button>
  ),
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
    formatMediumDate: (date: Date | number) => new Date(date).toISOString(),
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

jest.mock('../details/transaction-details', () => ({
  TransactionDetails: () => null,
}));

jest.mock('../details/templates/ramps/ramp-order-details-route', () => ({
  RampOrderDetailsRoute: ({ children }: { children: React.ReactNode }) =>
    children,
}));

describe('ActivityList', () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockUseLocalTransactions.mockReturnValue([]);
    mockUseRampsOrderActivity.mockReturnValue([]);
    window.history.replaceState(null, '', '/');
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

  it('passes entry point to useActivityScreenViewed', () => {
    mockUseTransactionsQuery.mockReturnValue({
      data: { pages: [] },
      isInitialLoading: false,
      fetchNextVisiblePage: jest.fn(),
    });

    render(<ActivityList entryPoint={ScreenViewedEntryPoint.BottomNavClick} />);

    expect(mockUseActivityScreenViewed).toHaveBeenCalledWith(
      expect.objectContaining({
        entryPoint: ScreenViewedEntryPoint.BottomNavClick,
      }),
    );
  });

  it('keeps the ramp classification when a local item shares the settlement hash', () => {
    const timestamp = new Date('2025-01-02T12:00:00Z').getTime();
    mockUseTransactionsQuery.mockReturnValue({
      data: { pages: [] },
      isInitialLoading: false,
      fetchNextVisiblePage: jest.fn(),
    });
    mockUseRampsOrderActivity.mockReturnValue([
      {
        type: 'rampBuy',
        chainId: 'eip155:1',
        status: 'success',
        timestamp,
        hash: '0xabc',
        data: { id: 'order-1', from: '0x1' },
      },
    ]);
    mockUseLocalTransactions.mockReturnValue([
      {
        type: 'contractInteraction',
        chainId: 'eip155:1',
        status: 'success',
        timestamp,
        hash: '0xabc',
        data: { from: '0x1', to: '0x2' },
      },
    ]);

    render(<ActivityList />);

    expect(screen.getByTestId('activity-row-rampBuy')).toBeInTheDocument();
    expect(
      screen.queryByTestId('activity-row-contractInteraction'),
    ).not.toBeInTheDocument();
  });

  it('navigates to details using the internal ramps order code', () => {
    const pushStateSpy = jest.spyOn(window.history, 'pushState');
    mockUseTransactionsQuery.mockReturnValue({
      data: { pages: [] },
      isInitialLoading: false,
      fetchNextVisiblePage: jest.fn(),
    });
    mockUseRampsOrderActivity.mockReturnValue([
      {
        type: 'rampBuy',
        chainId: 'eip155:1',
        status: 'pending',
        timestamp: 1,
        data: { id: 'moonpay/orders/native-uuid', from: '0x1' },
      },
    ]);

    render(<ActivityList />);
    fireEvent.click(screen.getByTestId('activity-row-rampBuy'));

    expect(pushStateSpy).toHaveBeenCalledWith(
      null,
      '',
      '#/tx/eip155:1/native-uuid',
    );
    pushStateSpy.mockRestore();
  });

  it('renders a pending header when a ramp order is pending', () => {
    mockUseTransactionsQuery.mockReturnValue({
      data: { pages: [] },
      isInitialLoading: false,
      fetchNextVisiblePage: jest.fn(),
    });
    mockUseRampsOrderActivity.mockReturnValue([
      {
        type: 'rampBuy',
        chainId: 'eip155:1',
        status: 'pending',
        timestamp: 1,
        data: { id: 'order-1', from: '0x1' },
      },
    ]);

    render(<ActivityList />);

    expect(screen.getByText('[pending]')).toBeInTheDocument();
    expect(screen.getByTestId('activity-row-rampBuy')).toBeInTheDocument();
  });
});
