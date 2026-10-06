import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import {
  CANCEL_TYPES,
  PAYMENT_TYPES,
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
  Subscription,
  SUBSCRIPTION_STATUSES,
  SubscriptionPaymentMethod,
} from '@metamask/subscription-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import {
  GATOR_PERMISSIONS,
  NETWORKS_ROUTE,
  PERMISSIONS,
} from '../../../helpers/constants/routes';
import {
  getIsMetaMaskShieldFeatureEnabled,
  isGatorPermissionsRevocationFeatureEnabled,
} from '../../../../shared/lib/environment';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { DAY } from '../../../../shared/constants/time';
import { useSubscriptionMetrics } from '../../../hooks/shield/metrics/useSubscriptionMetrics';
import { useUserSubscriptions } from '../../../hooks/subscription/useSubscription';
import { GlobalMenuDrawer } from './global-menu-drawer';
import { GlobalMenuDrawerWithList } from './global-menu-drawer-with-list';

const mockTrackEvent = jest.fn();

const getEnvironmentType = jest.requireMock(
  '../../../../shared/lib/environment-type',
).getEnvironmentType as jest.Mock;

jest.mock('../../../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../../../shared/lib/environment-type'),
  getEnvironmentType: jest.fn(),
}));

jest.mock('../../../../shared/lib/environment');

jest.mock('../../../hooks/useSidePanelEnabled', () => ({
  useSidePanelEnabled: jest.fn(() => false),
}));

jest.mock('../../../../shared/lib/browser-runtime.utils', () => ({
  ...jest.requireActual('../../../../shared/lib/browser-runtime.utils'),
  getBrowserName: jest.fn(() => 'Chrome'),
}));

jest.mock('../../../hooks/useBrowserSupportsSidePanel', () => ({
  useBrowserSupportsSidePanel: jest.fn(() => false),
}));

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

jest.mock('../../../hooks/shield/metrics/useSubscriptionMetrics', () => ({
  useSubscriptionMetrics: jest.fn(() => ({
    captureCommonExistingShieldSubscriptionEvents: jest.fn(),
  })),
}));

jest.mock('../../../hooks/subscription/useSubscription', () => ({
  useUserSubscriptions: jest.fn(() => ({ subscriptions: [] })),
}));

jest.mock('../notifications-tag-counter/notifications-tag-counter', () => ({
  NotificationsTagCounter: () => <span data-testid="notifications-tag" />,
}));

jest.mock('../../../pages/notifications/NewFeatureTag', () => ({
  NewFeatureTag: () => null,
}));

describe('GlobalMenuDrawer', () => {
  beforeAll(() => {
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function showModal() {
        this.setAttribute('open', '');
      };
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = function close() {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
      };
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    getEnvironmentType.mockReturnValue('popup');
  });

  it('renders children when open', async () => {
    const onClose = jest.fn();
    const { getByText, getByTestId } = renderWithProvider(
      <GlobalMenuDrawer
        isOpen
        onClose={onClose}
        data-testid="global-menu-drawer"
      >
        <span>Drawer content</span>
      </GlobalMenuDrawer>,
      configureStore(mockState),
      '/',
    );

    await waitFor(() => {
      expect(getByText('Drawer content')).toBeInTheDocument();
    });

    expect(getByTestId('global-menu-drawer')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithProvider(
      <GlobalMenuDrawer
        isOpen
        onClose={onClose}
        data-testid="global-menu-drawer"
      >
        <span>Content</span>
      </GlobalMenuDrawer>,
      configureStore(mockState),
      '/',
    );

    await waitFor(() => {
      expect(getByTestId('drawer-close-button')).toBeInTheDocument();
    });

    fireEvent.click(getByTestId('drawer-close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the dialog is dismissed', async () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithProvider(
      <GlobalMenuDrawer
        isOpen
        onClose={onClose}
        data-testid="global-menu-drawer"
      >
        <span>Content</span>
      </GlobalMenuDrawer>,
      configureStore(mockState),
      '/',
    );

    await waitFor(() => {
      expect(getByTestId('global-menu-drawer')).toHaveAttribute('open');
    });

    // Native <dialog> closes on Escape and fires the close event
    (getByTestId('global-menu-drawer') as HTMLDialogElement).close();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog closed when isOpen is false', () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithProvider(
      <GlobalMenuDrawer
        isOpen={false}
        onClose={onClose}
        data-testid="global-menu-drawer"
      >
        <span>Content</span>
      </GlobalMenuDrawer>,
      configureStore(mockState),
      '/',
    );

    expect(getByTestId('global-menu-drawer')).not.toHaveAttribute('open');
  });

  it('networks item navigates to the dedicated networks page', async () => {
    const store = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        transactions: [],
      },
    });
    const { getByTestId } = renderWithProvider(
      <GlobalMenuDrawerWithList
        isOpen
        onClose={() => undefined}
        data-testid="global-menu-drawer"
      />,
      store,
      '/',
    );

    await waitFor(() => {
      const link = getByTestId('global-menu-networks');
      expect(link).toBeInTheDocument();
      expect(link.getAttribute('href')).toContain(NETWORKS_ROUTE);
      expect(link.getAttribute('href')).toContain('drawerOpen=true');
    });
  });
});

describe('GlobalMenuDrawerWithList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getEnvironmentType.mockReturnValue('popup');
    jest
      .mocked(isGatorPermissionsRevocationFeatureEnabled)
      .mockReturnValue(false);
  });

  it('renders menu list when open', async () => {
    const onClose = jest.fn();
    const store = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        transactions: [],
      },
    });
    const { getByTestId } = renderWithProvider(
      <GlobalMenuDrawerWithList
        isOpen
        onClose={onClose}
        data-testid="global-menu-drawer"
      />,
      store,
      '/',
    );

    await waitFor(
      () => {
        expect(getByTestId('global-menu-connected-sites')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(getByTestId('global-menu-drawer')).toBeInTheDocument();
  });

  it('connected sites link includes from param when at default route and Gator feature enabled', async () => {
    jest
      .mocked(isGatorPermissionsRevocationFeatureEnabled)
      .mockReturnValue(true);

    const store = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        transactions: [],
      },
    });
    const { getByTestId } = renderWithProvider(
      <GlobalMenuDrawerWithList
        isOpen
        onClose={() => undefined}
        data-testid="global-menu-drawer"
      />,
      store,
      '/',
    );

    await waitFor(() => {
      const link = getByTestId('global-menu-connected-sites');
      expect(link).toBeInTheDocument();
      expect(link.getAttribute('href')).toContain(GATOR_PERMISSIONS);
      expect(link.getAttribute('href')).toContain('from=%2F');
    });
  });

  it('connected sites link includes from param when at default route and Gator feature disabled', async () => {
    jest
      .mocked(isGatorPermissionsRevocationFeatureEnabled)
      .mockReturnValue(false);

    const store = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        transactions: [],
      },
    });
    const { getByTestId } = renderWithProvider(
      <GlobalMenuDrawerWithList
        isOpen
        onClose={() => undefined}
        data-testid="global-menu-drawer"
      />,
      store,
      '/',
    );

    await waitFor(() => {
      const link = getByTestId('global-menu-connected-sites');
      expect(link).toBeInTheDocument();
      expect(link.getAttribute('href')).toContain(PERMISSIONS);
      expect(link.getAttribute('href')).toContain('from=%2F');
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn();
    const store = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        transactions: [],
      },
    });
    const { getByTestId } = renderWithProvider(
      <GlobalMenuDrawerWithList
        isOpen
        onClose={onClose}
        data-testid="global-menu-drawer"
      />,
      store,
      '/',
    );

    await waitFor(() => {
      expect(getByTestId('drawer-close-button')).toBeInTheDocument();
    });

    fireEvent.click(getByTestId('drawer-close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

const ACTIVE_SHIELD_SUBSCRIPTION: Subscription = {
  id: 'sub_123',
  status: SUBSCRIPTION_STATUSES.active,
  products: [
    {
      name: PRODUCT_TYPES.SHIELD,
      currency: 'usd',
      unitAmount: 100,
      unitDecimals: 2,
    },
  ],
  paymentMethod: { type: PAYMENT_TYPES.byCard } as SubscriptionPaymentMethod,
  interval: RECURRING_INTERVALS.month,
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date(Date.now() + 30 * DAY).toISOString(),
  isEligibleForSupport: true,
  cancelType: CANCEL_TYPES.ALLOWED_AT_PERIOD_END,
};

describe('GlobalMenuDrawerWithList support menu', () => {
  const captureCommonExistingShieldSubscriptionEvents = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getEnvironmentType.mockReturnValue('popup');
    jest
      .mocked(isGatorPermissionsRevocationFeatureEnabled)
      .mockReturnValue(false);
    jest.mocked(getIsMetaMaskShieldFeatureEnabled).mockReturnValue(false);
    jest.mocked(useUserSubscriptions).mockReturnValue({
      subscriptions: [],
    } as unknown as ReturnType<typeof useUserSubscriptions>);
    jest.mocked(useSubscriptionMetrics).mockReturnValue({
      captureCommonExistingShieldSubscriptionEvents,
    } as unknown as ReturnType<typeof useSubscriptionMetrics>);
  });

  async function renderOpenMenu(
    onClose: () => void,
    useExternalServices = false,
  ) {
    const store = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        transactions: [],
        useExternalServices,
      },
    });
    const view = renderWithProvider(
      <GlobalMenuDrawerWithList
        isOpen
        onClose={onClose}
        data-testid="global-menu-drawer"
      />,
      store,
      '/',
    );

    await waitFor(() => {
      expect(view.getByTestId('global-menu-support')).toBeInTheDocument();
    });

    return view;
  }

  it('tracks Support Link Clicked when shield priority support is unavailable', async () => {
    const onClose = jest.fn();
    const { getByTestId } = await renderOpenMenu(onClose);

    fireEvent.click(getByTestId('global-menu-support'));

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SupportLinkClicked,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Home,
          url: process.env.SUPPORT_LINK || '',
          location: 'Home',
        }),
      }),
    );
    expect(
      captureCommonExistingShieldSubscriptionEvents,
    ).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('tracks Shield Priority Support Clicked and skips Support Link Clicked when shield is active', async () => {
    jest.mocked(getIsMetaMaskShieldFeatureEnabled).mockReturnValue(true);
    jest.mocked(useUserSubscriptions).mockReturnValue({
      subscriptions: [ACTIVE_SHIELD_SUBSCRIPTION],
    } as ReturnType<typeof useUserSubscriptions>);

    const onClose = jest.fn();
    const { getByTestId } = await renderOpenMenu(onClose, true);

    fireEvent.click(getByTestId('global-menu-support'));

    expect(captureCommonExistingShieldSubscriptionEvents).toHaveBeenCalledWith(
      {
        subscriptionStatus: SUBSCRIPTION_STATUSES.active,
        paymentType: PAYMENT_TYPES.byCard,
        billingInterval: RECURRING_INTERVALS.month,
        cryptoPaymentChain: undefined,
        cryptoPaymentCurrency: undefined,
      },
      MetaMetricsEventName.ShieldPrioritySupportClicked,
    );
    expect(mockTrackEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SupportLinkClicked,
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
