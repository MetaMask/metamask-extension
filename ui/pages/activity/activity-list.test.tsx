import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { act, render } from '@testing-library/react';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import { ActivityList } from './activity-list';
import type { ActivityListFilter } from './helpers';

// ─── dependency mocks ────────────────────────────────────────────────────────

const mockUseTransactionsQuery = jest.fn();
const mockUseLocalTransactions = jest.fn();
const mockUseNonEvmTransactions = jest.fn();
const mockAssetListControlBar = jest.fn();

jest.mock('./useTransactionsQuery', () => ({
  useTransactionsQuery: (...args: unknown[]) =>
    mockUseTransactionsQuery(...args),
}));

jest.mock('./useLocalTransactions', () => ({
  useLocalTransactions: (...args: unknown[]) =>
    mockUseLocalTransactions(...args),
}));

jest.mock('./useNonEvmTransactions', () => ({
  useNonEvmTransactions: (...args: unknown[]) =>
    mockUseNonEvmTransactions(...args),
}));

jest.mock(
  '../../components/app/assets/asset-list/asset-list-control-bar/asset-list-control-bar',
  () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: (...args: unknown[]) => mockAssetListControlBar(...args),
  }),
);

jest.mock('../../components/ui/virtualized-list/virtualized-list', () => ({
  VirtualizedList: () => null,
}));

jest.mock('../../components/app/transaction-activity-empty-state', () => ({
  TransactionActivityEmptyState: () => null,
}));

jest.mock('./legacy-details', () => ({ LegacyDetails: () => null }));
jest.mock('./rows/activity-row', () => ({ ActivityRow: () => null }));
jest.mock('../../components/ui/section-header', () => ({
  SectionHeader: () => null,
}));

jest.mock(
  '../../components/app/pending-transaction-action-buttons/pending-transaction-cancel-speed-up-provider',
  () => ({
    PendingTransactionCancelSpeedUpProvider: ({
      children,
    }: {
      children: React.ReactNode;
    }) => <>{children}</>,
  }),
);

jest.mock('../../contexts/scroll-container', () => ({
  useScrollContainer: () => ({ current: null }),
}));

jest.mock('../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../hooks/useFormatters', () => ({
  useFormatters: () => ({ formatMediumDate: () => '' }),
}));

jest.mock('../../hooks/useItemInView', () => ({
  useItemInView: () => jest.fn(),
}));

// ─── helpers ─────────────────────────────────────────────────────────────────

const mockTrackEvent = jest.fn();

const mockMetaMetrics = {
  trackEvent: mockTrackEvent,
  bufferedTrace: jest.fn(),
  bufferedEndTrace: jest.fn(),
  onboardingParentContext: { current: null },
};

function createStore() {
  return configureMockStore()({
    metamask: {
      enabledNetworkMap: { eip155: { '0x1': true } },
    },
  });
}

const defaultQueryResult = {
  data: { pages: [] },
  isInitialLoading: false,
  fetchNextVisiblePage: jest.fn(),
};

function makeItem(overrides: Partial<ActivityListItem> = {}): ActivityListItem {
  return {
    type: 'send',
    chainId: 'eip155:1',
    status: 'success',
    timestamp: 1_000_000,
    data: { hash: '0xabc', from: '0x1', to: '0x2' },
    ...overrides,
  } as ActivityListItem;
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('ActivityList — ActivityScreenOpened metric', () => {
  let capturedOnNetworkSelect: ((networks: string[]) => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnNetworkSelect = undefined;

    mockUseTransactionsQuery.mockReturnValue(defaultQueryResult);
    mockUseLocalTransactions.mockReturnValue([]);
    mockUseNonEvmTransactions.mockReturnValue([]);

    mockAssetListControlBar.mockImplementation(
      ({
        onNetworkSelect,
      }: {
        onNetworkSelect?: (networks: string[]) => void;
      }) => {
        capturedOnNetworkSelect = onNetworkSelect;
        return null;
      },
    );
  });

  function renderList(filter?: ActivityListFilter) {
    return render(
      <Provider store={createStore()}>
        <MetaMetricsContext.Provider value={mockMetaMetrics}>
          <ActivityList filter={filter} />
        </MetaMetricsContext.Provider>
      </Provider>,
    );
  }

  function initNetworks(networks = ['eip155:1']) {
    act(() => {
      capturedOnNetworkSelect?.(networks);
    });
  }

  it('does not fire before AssetListControlBar initialises networks', () => {
    renderList();

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('does not fire while isInitialLoading is true', () => {
    mockUseTransactionsQuery.mockReturnValue({
      ...defaultQueryResult,
      isInitialLoading: true,
    });

    renderList();
    initNetworks();

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('fires once with is_empty: true when the list has no items', () => {
    renderList();
    initNetworks();

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith({
      category: MetaMetricsEventCategory.Home,
      event: MetaMetricsEventName.ActivityScreenOpened,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        network_filter: ['eip155:1'],
        // eslint-disable-next-line @typescript-eslint/naming-convention
        is_empty: true,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        pending_transactions: 0,
      },
    });
  });

  it('fires with is_empty: false when items are present', () => {
    mockUseLocalTransactions.mockReturnValue([makeItem()]);

    renderList();
    initNetworks();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: MetaMetricsEventName.ActivityScreenOpened,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        properties: expect.objectContaining({ is_empty: false }),
      }),
    );
  });

  it('counts pending local and non-evm transactions', () => {
    mockUseLocalTransactions.mockReturnValue([
      makeItem({
        status: 'pending',
        data: { hash: '0x1', from: '0xa', to: '0xb' },
      }),
      makeItem({
        status: 'success',
        data: { hash: '0x2', from: '0xa', to: '0xb' },
      }),
    ]);
    mockUseNonEvmTransactions.mockReturnValue([
      makeItem({
        chainId: 'solana:mainnet',
        status: 'pending',
        data: { hash: 'sol1', from: '0xa', to: '0xb' },
      }),
    ]);

    renderList();
    initNetworks();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        properties: expect.objectContaining({ pending_transactions: 2 }),
      }),
    );
  });

  it('fires at most once per mount even if deps cycle', () => {
    const { rerender } = renderList();
    initNetworks();

    // Simulate isInitialLoading cycling true → false
    mockUseTransactionsQuery.mockReturnValue({
      ...defaultQueryResult,
      isInitialLoading: true,
    });
    rerender(
      <Provider store={createStore()}>
        <MetaMetricsContext.Provider value={mockMetaMetrics}>
          <ActivityList />
        </MetaMetricsContext.Provider>
      </Provider>,
    );
    mockUseTransactionsQuery.mockReturnValue(defaultQueryResult);
    rerender(
      <Provider store={createStore()}>
        <MetaMetricsContext.Provider value={mockMetaMetrics}>
          <ActivityList />
        </MetaMetricsContext.Provider>
      </Provider>,
    );

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
  });

  it('does not fire when a filter prop is provided (embedded view)', () => {
    renderList({ networks: ['eip155:1'] });

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });
});
