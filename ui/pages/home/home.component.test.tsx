import React from 'react';
import { render } from '@testing-library/react';
import { I18nContext } from '../../contexts/i18n';
import { MetaMetricsContext } from '../../contexts/metametrics';
import Home from './home.component';

jest.mock('../../components/multichain', () => ({
  AccountOverview: () => null,
}));
jest.mock('../../components/app/terms-of-use-popup', () => ({
  TermsOfUsePopupContainer: () => null,
}));
jest.mock(
  '../../components/app/metametrics-consent/metametrics-consent-container',
  () => ({ MetaMetricsConsentContainer: () => null }),
);
jest.mock('../../components/app/recovery-phrase-reminder', () => ({
  RecoveryPhraseReminderContainer: () => null,
}));
jest.mock(
  '../../components/app/imported-tokens-notification/imported-tokens-notification-container',
  () => ({ ImportedTokensNotificationContainer: () => null }),
);
jest.mock(
  '../../components/app/multi-rpc-edit-modal/multi-rpc-edit-modal-container',
  () => ({ MultiRpcEditModalContainer: () => null }),
);
jest.mock('../../components/app/update-modal/update-modal-container', () => ({
  UpdateModalContainer: () => null,
}));
jest.mock('./connected-status-popover-container', () => ({
  ConnectedStatusPopoverContainer: () => null,
}));
jest.mock('../../components/app/password-outdated-modal', () => ({
  PasswordOutdatedModalContainer: () => null,
}));
jest.mock('../../components/app/shield-entry-modal', () => ({
  ShieldEntryModalContainer: () => null,
}));
jest.mock(
  '../../components/app/rewards/onboarding/rewards-modal-container',
  () => ({ RewardsModalContainer: () => null }),
);
jest.mock(
  '../../components/app/modals/pna25-modal/pna25-modal-container',
  () => ({ Pna25ModalContainer: () => null }),
);
jest.mock('./deeplink-qrcode-modal-container', () => ({
  DeeplinkQrCodeModalContainer: () => null,
}));
jest.mock('./shield-cohort-container', () => ({
  ShieldCohortContainer: () => null,
}));
jest.mock('./home-notifications-container', () => ({
  HomeNotificationsContainer: () => null,
}));
jest.mock('../connected-sites', () => () => null);
jest.mock('../connected-accounts', () => () => null);
jest.mock('./beta-and-flask-home-footer.component', () => () => null);
jest.mock('./HomeDeepLinkActions', () => ({ HomeDeepLinkActions: () => null }));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: jest.fn(() => null),
}));
jest.mock('../../../shared/lib/build-types', () => ({
  isBeta: jest.fn().mockReturnValue(false),
  isFlask: jest.fn().mockReturnValue(false),
  isMain: jest.fn().mockReturnValue(true),
}));
// The redirect hooks are unit-tested independently; stub them here so the
// smoke render doesn't need to satisfy their prop shapes.
jest.mock('./useHomeRedirects', () => ({
  useRedirectAfterDefaultPage: jest.fn(),
  usePendingRedirectRoute: jest.fn(),
  useLastVisitedPerpsRoute: jest.fn(),
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
    notificationClosing: false,
    attemptCloseNotificationPopup: jest.fn(),
    fetchBuyableChains: jest.fn(),
    lookupSelectedNetworks: jest.fn(),
    ...overrides,
  };
}

function wrapWithContext(element: React.ReactElement) {
  return (
    <I18nContext.Provider value={t}>
      <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
        {element}
      </MetaMetricsContext.Provider>
    </I18nContext.Provider>
  );
}

function renderHome(overrides: Record<string, unknown> = {}) {
  const props = buildDefaultProps(overrides);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = render(wrapWithContext(<Home {...(props as any)} />));
  return { ...result, props };
}

describe('Home — smoke and early-return guards', () => {
  it('renders without crashing', () => {
    const { container } = renderHome();
    expect(container).toBeTruthy();
  });

  it('redirects to restore-vault when forgottenPassword is true', () => {
    const { Navigate } = jest.requireMock('react-router-dom');
    renderHome({ forgottenPassword: true });
    expect(Navigate).toHaveBeenCalled();
  });

  it('renders nothing when notificationClosing is true', () => {
    const { container } = renderHome({ notificationClosing: true });
    expect(container.firstChild).toBeNull();
  });
});
