import React from 'react';
import { fireEvent } from '@testing-library/react';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { useTokenBalances } from '../../../hooks/useTokenBalances';
import { clearABTestExposureTrackingForTest } from '../../../hooks/useABTest';
import { setPerpsTabBadgeSeen } from '../../../store/actions';
import { PERPS_TAB_BADGE_AB_KEY } from '../../../../shared/lib/ab-testing/configs/perps-tab-badge';
import { AccountOverviewTabs } from './account-overview-tabs';

const mockTrackEvent = jest.fn();

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

jest.mock('../../../store/actions', () => ({
  setDefaultHomeActiveTabName: jest.fn(),
  detectNfts: jest.fn(() => ({ type: 'MOCK_DETECT_NFTS' })),
  setPerpsTabBadgeSeen: jest.fn(() => () => Promise.resolve()),
}));

jest.mock('../../../hooks/useTokenBalances', () => ({
  useTokenBalances: jest.fn(),
}));

jest.mock('../../app/assets/asset-list', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => null,
}));

jest.mock('../activity-v2/activity-list', () => ({
  ActivityList: () => null,
}));

jest.mock('../../../pages/activity/activity-list', () => ({
  ActivityList: () => null,
}));

jest.mock('../activity-v2/useTransactionsQuery', () => ({
  usePrefetchTransactions: () => jest.fn(),
}));

jest.mock('../../app/assets/nfts/nfts-tab', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => null,
}));

jest.mock('../../app/assets/defi-list/defi-tab', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => null,
}));

jest.mock('../../app/perps/perps-tab', () => ({
  PerpsTab: () => <div data-testid="perps-tab-mock">PerpsTab</div>,
}));

beforeEach(() => {
  jest.clearAllMocks();
  (useTokenBalances as jest.Mock).mockReturnValue({ tokenBalances: {} });
});

describe('AccountOverviewTabs - event metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fire trackEvent when clicking the Activity tab (V3 mode)', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        enabledNetworkMap: { eip155: { [CHAIN_IDS.MAINNET]: true } },
        remoteFeatureFlags: { extensionUxActivityListRedesign: true },
      },
    });

    const { getByText } = renderWithProvider(
      <AccountOverviewTabs
        showTokens={true}
        showNfts={false}
        showActivity={true}
        setBasicFunctionalityModalOpen={jest.fn()}
        onSupportLinkClick={jest.fn()}
      />,
      store,
    );

    fireEvent.click(getByText(messages.activity.message));

    // ActivityScreenOpened is deferred to ActivityListV3; tab click must not
    // fire any metric.
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('fires ActivityScreenOpened when clicking the Activity tab (V2 mode)', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        enabledNetworkMap: { eip155: { [CHAIN_IDS.MAINNET]: true } },
        remoteFeatureFlags: { extensionUxActivityListRedesign: false },
      },
    });

    const { getByText } = renderWithProvider(
      <AccountOverviewTabs
        showTokens={true}
        showNfts={false}
        showActivity={true}
        setBasicFunctionalityModalOpen={jest.fn()}
        onSupportLinkClick={jest.fn()}
      />,
      store,
    );

    fireEvent.click(getByText(messages.activity.message));

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.ActivityScreenOpened,
        properties: expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          network_filter: ['eip155:1'],
        }),
      }),
    );
  });

  it('includes network_filter property with both EVM and non-EVM networks in CAIP format', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        enabledNetworkMap: {
          eip155: {
            [CHAIN_IDS.MAINNET]: true,
            [CHAIN_IDS.POLYGON]: true,
          },
          solana: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
          },
        },
      },
    });

    const { getByText } = renderWithProvider(
      <AccountOverviewTabs
        showTokens={true}
        showNfts={false}
        showActivity={true}
        setBasicFunctionalityModalOpen={jest.fn()}
        onSupportLinkClick={jest.fn()}
      />,
      store,
      '/?tab=activity',
    );

    // Click a tab to trigger event
    fireEvent.click(getByText(messages.tokens.message));

    // Verify network_filter property is included in correct format
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: MetaMetricsEventName.TokenScreenOpened,
      properties: {
        category: MetaMetricsEventCategory.Home,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        network_filter: [
          'eip155:1',
          'eip155:137',
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        ],
      },
      sensitiveProperties: {},
    });
  });
});

describe('AccountOverviewTabs - Perps tab New badge (TAT-3382)', () => {
  const BADGE_TESTID = 'perps-tab-new-badge';
  const PERPS_TAB_TESTID = 'account-overview__perps-tab';
  let originalPerpsEnabled: string | undefined;

  const renderTabs = ({
    variantFlag,
    perpsTabBadgeSeen = false,
    perpsAvailable = true,
    showTokens = true,
    route,
  }: {
    variantFlag?: { name: string };
    perpsTabBadgeSeen?: boolean;
    perpsAvailable?: boolean;
    showTokens?: boolean;
    route?: string;
  }) => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        enabledNetworkMap: { eip155: { [CHAIN_IDS.MAINNET]: true } },
        perpsTabBadgeSeen,
        remoteFeatureFlags: {
          ...(perpsAvailable
            ? {
                perpsEnabledVersion: { enabled: true, minimumVersion: '0.0.0' },
              }
            : {}),
          ...(variantFlag ? { [PERPS_TAB_BADGE_AB_KEY]: variantFlag } : {}),
        },
      },
    });

    return renderWithProvider(
      <AccountOverviewTabs
        showTokens={showTokens}
        showNfts={false}
        showActivity={false}
        setBasicFunctionalityModalOpen={jest.fn()}
        onSupportLinkClick={jest.fn()}
      />,
      store,
      route,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    clearABTestExposureTrackingForTest();
    originalPerpsEnabled = process.env.PERPS_ENABLED;
    process.env.PERPS_ENABLED = 'true';
    (useTokenBalances as jest.Mock).mockReturnValue({ tokenBalances: {} });
  });

  afterEach(() => {
    process.env.PERPS_ENABLED = originalPerpsEnabled;
  });

  it('renders the Perps tab without a New badge in the control assignment', () => {
    const { getByTestId, queryByTestId } = renderTabs({
      variantFlag: { name: 'control' },
    });

    expect(getByTestId(PERPS_TAB_TESTID)).toBeInTheDocument();
    expect(queryByTestId(BADGE_TESTID)).not.toBeInTheDocument();
  });

  it('renders the New badge on the Perps tab in the treatment assignment', () => {
    const { getByTestId } = renderTabs({ variantFlag: { name: 'treatment' } });

    const badge = getByTestId(BADGE_TESTID);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(messages.perpsFilterNew.message);
  });

  it('hides the New badge once it has been seen (persisted dismissal)', () => {
    const { queryByTestId } = renderTabs({
      variantFlag: { name: 'treatment' },
      perpsTabBadgeSeen: true,
    });

    expect(queryByTestId(BADGE_TESTID)).not.toBeInTheDocument();
  });

  it('persists the dismissal via AppStateController when the Perps tab is clicked', () => {
    const { getByText } = renderTabs({ variantFlag: { name: 'treatment' } });

    fireEvent.click(getByText(messages.perps.message));

    expect(setPerpsTabBadgeSeen).toHaveBeenCalledWith(true);
  });

  it('persists the dismissal when the Perps tab is already the active tab on mount', () => {
    renderTabs({ variantFlag: { name: 'treatment' }, route: '/?tab=perps' });

    // No tab click occurs — landing directly on Perps (persisted default tab or
    // ?tab=perps) must still mark the badge seen.
    expect(setPerpsTabBadgeSeen).toHaveBeenCalledWith(true);
  });

  it('does not persist dismissal on mount for a control user already on the Perps tab', () => {
    renderTabs({ variantFlag: { name: 'control' }, route: '/?tab=perps' });

    expect(setPerpsTabBadgeSeen).not.toHaveBeenCalled();
  });

  it('persists the dismissal when Perps is the clamped active tab (active tab hidden)', () => {
    // Tokens is hidden but activeTabKey points at the now-hidden Tokens tab, so
    // Tabs clamps the rendered active tab to the first one (Perps). The badge
    // must still be marked seen even though no tab click occurs.
    renderTabs({
      variantFlag: { name: 'treatment' },
      showTokens: false,
      route: '/?tab=tokens',
    });

    expect(setPerpsTabBadgeSeen).toHaveBeenCalledWith(true);
  });

  it('does not mark the badge seen while Perps is unavailable, even when it is the active tab', () => {
    // Treatment + ?tab=perps but the Perps experience is unavailable: the badge
    // is never rendered, so it must not be persisted as seen (otherwise it would
    // be suppressed once Perps becomes available).
    renderTabs({
      variantFlag: { name: 'treatment' },
      perpsAvailable: false,
      route: '/?tab=perps',
    });

    expect(setPerpsTabBadgeSeen).not.toHaveBeenCalled();
  });

  it('does not emit a Perp Screen Viewed event from the tab click (PerpsView owns that event)', () => {
    const { getByText } = renderTabs({ variantFlag: { name: 'treatment' } });

    fireEvent.click(getByText(messages.perps.message));

    expect(mockTrackEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.PerpsScreenViewed,
      }),
    );
  });

  it('does not render the Perps tab when the perps experience is unavailable', () => {
    const { queryByTestId } = renderTabs({
      variantFlag: { name: 'treatment' },
      perpsAvailable: false,
    });

    expect(queryByTestId(PERPS_TAB_TESTID)).not.toBeInTheDocument();
    expect(queryByTestId(BADGE_TESTID)).not.toBeInTheDocument();
  });

  it('fires the Experiment Viewed event with the treatment assignment', () => {
    renderTabs({ variantFlag: { name: 'treatment' } });

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.ExperimentViewed,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Analytics,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          experiment_id: PERPS_TAB_BADGE_AB_KEY,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          variation_id: 'treatment',
        }),
      }),
    );
  });

  it('does not persist dismissal when a control user clicks the Perps tab', () => {
    const { getByText } = renderTabs({ variantFlag: { name: 'control' } });

    fireEvent.click(getByText(messages.perps.message));

    expect(setPerpsTabBadgeSeen).not.toHaveBeenCalled();
  });

  it('records exposure for control symmetrically with treatment', () => {
    renderTabs({ variantFlag: { name: 'control' } });

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.ExperimentViewed,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Analytics,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          variation_id: 'control',
        }),
      }),
    );
  });

  it('still records exposure after the badge has been dismissed (symmetric per session)', () => {
    renderTabs({ variantFlag: { name: 'treatment' }, perpsTabBadgeSeen: true });

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.ExperimentViewed,
      }),
    );
  });

  it('does not record exposure when the perps experience is unavailable', () => {
    renderTabs({ variantFlag: { name: 'treatment' }, perpsAvailable: false });

    expect(mockTrackEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.ExperimentViewed,
      }),
    );
  });
});

describe('AccountOverviewTabs - TokenBalancesPoller', () => {
  it('polls token balances for the enabled EVM chain IDs', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        enabledNetworkMap: {
          eip155: {
            [CHAIN_IDS.MAINNET]: true,
            [CHAIN_IDS.POLYGON]: true,
          },
        },
      },
    });

    renderWithProvider(
      <AccountOverviewTabs
        showTokens={true}
        showNfts={false}
        showActivity={false}
        setBasicFunctionalityModalOpen={jest.fn()}
        onSupportLinkClick={jest.fn()}
      />,
      store,
    );

    expect(useTokenBalances).toHaveBeenCalledWith(
      expect.objectContaining({
        chainIds: expect.arrayContaining([
          CHAIN_IDS.MAINNET,
          CHAIN_IDS.POLYGON,
        ]),
      }),
    );
  });
});
