import React from 'react';
import { render, act } from '@testing-library/react';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_FULLSCREEN,
} from '../../../shared/constants/app';
import { I18nContext, LegacyI18nProvider } from '../../contexts/i18n';
import {
  MetaMetricsContext,
  LegacyMetaMetricsProvider,
} from '../../contexts/metametrics';
import Home from './home.component';

jest.mock('../../components/multichain', () => ({
  AccountOverview: () => null,
}));
jest.mock('../../components/app/terms-of-use-popup', () => () => null);
jest.mock('../../components/app/recovery-phrase-reminder', () => () => null);
jest.mock('../../components/app/home-notification', () => () => null);
jest.mock('../../components/app/multiple-notifications', () => () => null);
jest.mock(
  '../../components/app/multi-rpc-edit-modal/multi-rpc-edit-modal',
  () => () => null,
);
jest.mock('../../components/app/update-modal/update-modal', () => () => null);
jest.mock('../../components/app/password-outdated-modal', () => () => null);
jest.mock('../../components/app/shield-entry-modal', () => () => null);
jest.mock(
  '../../components/app/rewards/onboarding/OnboardingModal',
  () => () => null,
);
jest.mock('../../components/app/modals/pna25-modal', () => ({
  Pna25Modal: () => null,
}));
jest.mock('../connected-sites', () => () => null);
jest.mock('../connected-accounts', () => () => null);
jest.mock('./beta-and-flask-home-footer.component', () => () => null);
jest.mock('./HomeDeepLinkActions', () => ({ HomeDeepLinkActions: () => null }));
jest.mock('../../../shared/lib/mv3.utils', () => ({
  isMv3ButOffscreenDocIsMissing: jest.fn().mockReturnValue(false),
}));
jest.mock('../../../shared/lib/build-types', () => ({
  isBeta: jest.fn().mockReturnValue(false),
  isFlask: jest.fn().mockReturnValue(false),
  isMain: jest.fn().mockReturnValue(true),
}));

const t = ((key: string) =>
  key) as unknown as typeof I18nContext extends React.Context<infer V>
  ? V
  : never;

const mockMetaMetricsContext = {
  trackEvent: jest.fn().mockResolvedValue(undefined),
  bufferedTrace: jest.fn().mockResolvedValue(undefined),
  bufferedEndTrace: jest.fn().mockResolvedValue(undefined),
  onboardingParentContext: { current: null },
} as unknown as React.ContextType<typeof MetaMetricsContext>;

function buildDefaultProps(overrides: Record<string, unknown> = {}) {
  return {
    navigate: jest.fn(),
    shouldShowSeedPhraseReminder: false,
    showRecoveryPhraseReminder: false,
    showTermsOfUsePopup: false,
    showMultiRpcModal: false,
    showUpdateModal: false,
    totalUnapprovedCount: 0,
    participateInMetaMetrics: false,
    setDataCollectionForMarketing: jest.fn(),
    shouldShowWeb3ShimUsageNotification: false,
    setWeb3ShimUsageAlertDismissed: jest.fn(),
    disableWeb3ShimUsageAlert: jest.fn(),
    infuraBlocked: false,
    setRecoveryPhraseReminderHasBeenShown: jest.fn(),
    setRecoveryPhraseReminderLastShown: jest.fn(),
    setTermsOfUseLastAgreed: jest.fn(),
    showOutdatedBrowserWarning: false,
    setOutdatedBrowserWarningLastShown: jest.fn(),
    attemptCloseNotificationPopup: jest.fn(),
    setNewTokensImported: jest.fn(),
    setNewTokensImportedError: jest.fn(),
    fetchBuyableChains: jest.fn(),
    lookupSelectedNetworks: jest.fn(),
    showPna25Modal: false,
    envType: ENVIRONMENT_TYPE_POPUP,
    pendingRedirectRoute: null as Record<string, unknown> | null,
    setRedirectAfterDefaultPage: jest.fn(),
    clearPendingRedirectRoute: jest.fn(),
    redirectAfterDefaultPage: null,
    clearRedirectAfterDefaultPage: jest.fn(),
    lastVisitedPerpsRoute: null as {
      path: string;
      timestamp: number;
    } | null,
    clearLastVisitedPerpsRoute: jest.fn(),
    ...overrides,
  };
}

function wrapWithContext(element: React.ReactElement) {
  return (
    <I18nContext.Provider value={t}>
      <LegacyI18nProvider>
        <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
          <LegacyMetaMetricsProvider>{element}</LegacyMetaMetricsProvider>
        </MetaMetricsContext.Provider>
      </LegacyI18nProvider>
    </I18nContext.Provider>
  );
}

function renderHome(overrides: Record<string, unknown> = {}) {
  const props = buildDefaultProps(overrides);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = render(wrapWithContext(<Home {...(props as any)} />));
  return { ...result, props };
}

describe('Home — checkPendingRedirectRoute', () => {
  it('does nothing when pendingRedirectRoute is null', () => {
    const { props } = renderHome({ pendingRedirectRoute: null });

    expect(props.setRedirectAfterDefaultPage).not.toHaveBeenCalled();
    expect(props.clearPendingRedirectRoute).not.toHaveBeenCalled();
  });

  it('redirects and clears when route has no environmentType restriction', () => {
    const { props } = renderHome({
      pendingRedirectRoute: { path: '/shield-plan' },
    });

    expect(props.setRedirectAfterDefaultPage).toHaveBeenCalledWith({
      path: '/shield-plan',
    });
    expect(props.clearPendingRedirectRoute).toHaveBeenCalled();
  });

  it('appends search when route includes a search query', () => {
    const { props } = renderHome({
      pendingRedirectRoute: {
        path: '/shield-plan',
        search: '?source=checkout',
      },
    });

    expect(props.setRedirectAfterDefaultPage).toHaveBeenCalledWith({
      path: '/shield-plan?source=checkout',
    });
    expect(props.clearPendingRedirectRoute).toHaveBeenCalled();
  });

  it('redirects when environmentType matches the current env', () => {
    const { props } = renderHome({
      envType: ENVIRONMENT_TYPE_POPUP,
      pendingRedirectRoute: {
        path: '/shield-plan',
        environmentType: ENVIRONMENT_TYPE_POPUP,
      },
    });

    expect(props.setRedirectAfterDefaultPage).toHaveBeenCalledWith({
      path: '/shield-plan',
    });
    expect(props.clearPendingRedirectRoute).toHaveBeenCalled();
  });

  it('does not redirect but still clears when environmentType does not match', () => {
    const { props } = renderHome({
      envType: ENVIRONMENT_TYPE_FULLSCREEN,
      pendingRedirectRoute: {
        path: '/shield-plan',
        environmentType: ENVIRONMENT_TYPE_POPUP,
      },
    });

    expect(props.setRedirectAfterDefaultPage).not.toHaveBeenCalled();
    expect(props.clearPendingRedirectRoute).toHaveBeenCalled();
  });

  it('processes pendingRedirectRoute in componentDidUpdate when prop transitions to non-null', () => {
    const setRedirectAfterDefaultPage = jest.fn();
    const clearPendingRedirectRoute = jest.fn();

    const initialProps = buildDefaultProps({
      pendingRedirectRoute: null,
      setRedirectAfterDefaultPage,
      clearPendingRedirectRoute,
    });

    const { rerender } = render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wrapWithContext(<Home {...(initialProps as any)} />),
    );

    expect(setRedirectAfterDefaultPage).not.toHaveBeenCalled();
    expect(clearPendingRedirectRoute).not.toHaveBeenCalled();

    const updatedProps = buildDefaultProps({
      pendingRedirectRoute: { path: '/shield-plan' },
      setRedirectAfterDefaultPage,
      clearPendingRedirectRoute,
    });

    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rerender(wrapWithContext(<Home {...(updatedProps as any)} />));
    });

    expect(setRedirectAfterDefaultPage).toHaveBeenCalledWith({
      path: '/shield-plan',
    });
    expect(clearPendingRedirectRoute).toHaveBeenCalled();
  });
});

describe('Home — checkLastVisitedPerpsRoute', () => {
  const FRESH_ENOUGH_OFFSET_MS = 60_000;
  const TTL_MS = 5 * 60_000;

  it('does nothing when lastVisitedPerpsRoute is null', () => {
    const { props } = renderHome({ lastVisitedPerpsRoute: null });

    expect(props.setRedirectAfterDefaultPage).not.toHaveBeenCalled();
    expect(props.clearLastVisitedPerpsRoute).not.toHaveBeenCalled();
  });

  it('redirects to the persisted perps path when within the TTL', () => {
    const { props } = renderHome({
      lastVisitedPerpsRoute: {
        path: '/perps/market/BTC',
        timestamp: Date.now() - FRESH_ENOUGH_OFFSET_MS,
      },
    });

    expect(props.setRedirectAfterDefaultPage).toHaveBeenCalledWith({
      path: '/perps/market/BTC',
    });
    expect(props.clearLastVisitedPerpsRoute).toHaveBeenCalled();
  });

  it('does not redirect but still clears when TTL has expired', () => {
    const { props } = renderHome({
      lastVisitedPerpsRoute: {
        path: '/perps/market/BTC',
        timestamp: Date.now() - (TTL_MS + 1_000),
      },
    });

    expect(props.setRedirectAfterDefaultPage).not.toHaveBeenCalled();
    expect(props.clearLastVisitedPerpsRoute).toHaveBeenCalled();
  });

  it('ignores persisted path that does not start with /perps', () => {
    const { props } = renderHome({
      lastVisitedPerpsRoute: {
        path: '/settings',
        timestamp: Date.now() - FRESH_ENOUGH_OFFSET_MS,
      },
    });

    expect(props.setRedirectAfterDefaultPage).not.toHaveBeenCalled();
    expect(props.clearLastVisitedPerpsRoute).toHaveBeenCalled();
  });

  it('defers to pendingRedirectRoute when both are set but still clears the persisted perps entry', () => {
    const { props } = renderHome({
      pendingRedirectRoute: { path: '/shield-plan' },
      lastVisitedPerpsRoute: {
        path: '/perps/market/BTC',
        timestamp: Date.now() - FRESH_ENOUGH_OFFSET_MS,
      },
    });

    expect(props.setRedirectAfterDefaultPage).toHaveBeenCalledWith({
      path: '/shield-plan',
    });
    expect(props.setRedirectAfterDefaultPage).toHaveBeenCalledTimes(1);
    // Even when pendingRedirectRoute wins, the perps entry must be cleared
    // so a later home mount cannot replay it after the higher-priority
    // redirect has already fired.
    expect(props.clearLastVisitedPerpsRoute).toHaveBeenCalled();
  });

  it('rejects a path with the /perps prefix that is not actually a /perps subroute', () => {
    const { props } = renderHome({
      lastVisitedPerpsRoute: {
        path: '/perpsNew/market/BTC',
        timestamp: Date.now() - FRESH_ENOUGH_OFFSET_MS,
      },
    });

    expect(props.setRedirectAfterDefaultPage).not.toHaveBeenCalled();
    expect(props.clearLastVisitedPerpsRoute).toHaveBeenCalled();
  });

  it('skips the redirect but still clears when PerpsLayout just unmounted in-app (covers the componentDidMount vs useEffect-cleanup race)', async () => {
    const markerModulePath = '../../helpers/perps/in-app-leave-marker';
    const {
      markPerpsUnmountInApp,
      __resetPerpsInAppLeaveMarkerForTests: resetPerpsInAppLeaveMarkerForTests,
    } = await import(markerModulePath);
    try {
      markPerpsUnmountInApp();

      const { props } = renderHome({
        lastVisitedPerpsRoute: {
          path: '/perps/market/BTC',
          timestamp: Date.now() - FRESH_ENOUGH_OFFSET_MS,
        },
      });

      expect(props.setRedirectAfterDefaultPage).not.toHaveBeenCalled();
      expect(props.clearLastVisitedPerpsRoute).toHaveBeenCalled();
    } finally {
      resetPerpsInAppLeaveMarkerForTests();
    }
  });
});
