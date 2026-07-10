import React from 'react';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../shared/constants/app';
import { setBackgroundConnection } from '../../store/background-connection';
import Home from './home';

const backgroundConnectionMock = new Proxy(
  {},
  {
    get: () => jest.fn().mockResolvedValue(undefined),
  },
);

jest.mock('../../components/multichain/app-header', () => ({
  AppHeader: () => <div data-testid="mock-app-header" />,
}));

jest.mock('../../components/multichain/dapp-connection-control-bar', () => ({
  DappConnectionControlBar: () => <div data-testid="dapp-control-bar-bottom" />,
}));

jest.mock('../../components/multichain', () => ({
  AccountOverview: () => <div data-testid="mock-account-overview" />,
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
jest.mock('../../contexts/shield/shield-subscription', () => ({
  useShieldSubscriptionContext: () => ({
    evaluateCohortEligibility: jest.fn(),
  }),
}));
jest.mock('../../../shared/lib/build-types', () => ({
  isBeta: jest.fn().mockReturnValue(false),
  isFlask: jest.fn().mockReturnValue(false),
  isMain: jest.fn().mockReturnValue(true),
}));
jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  attemptCloseNotificationPopup: jest.fn(),
}));
jest.mock('./useHomeRedirects', () => ({
  useRedirectAfterDefaultPage: jest.fn(),
  usePendingRedirectRoute: jest.fn(),
  useLastVisitedPerpsRoute: jest.fn(),
}));

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: jest.fn(() => null),
  useNavigate: () => mockNavigate,
}));

function createStore(overrides: Record<string, unknown> = {}) {
  return configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      isUnlocked: true,
      completedOnboarding: true,
      ...overrides,
    },
  });
}

function renderHome(storeOverrides: Record<string, unknown> = {}) {
  const store = createStore(storeOverrides);
  return renderWithProvider(<Home />, store);
}

beforeEach(() => {
  jest.clearAllMocks();
  setBackgroundConnection(backgroundConnectionMock as never);
});

describe('Home', () => {
  it('renders AppHeader and DappConnectionControlBar', () => {
    const { getByTestId } = renderHome();
    expect(getByTestId('mock-app-header')).toBeInTheDocument();
    expect(getByTestId('dapp-control-bar-bottom')).toBeInTheDocument();
  });

  it('renders DappConnectionControlBar after main home content', () => {
    const { getByTestId } = renderHome();
    const overview = getByTestId('mock-account-overview');
    const bar = getByTestId('dapp-control-bar-bottom');
    const position = overview.compareDocumentPosition(bar);
    expect(position).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('renders without crashing', () => {
    const { container } = renderHome();
    expect(container).toBeTruthy();
  });

  it('redirects to restore-vault when forgottenPassword is true', () => {
    const { Navigate } = jest.requireMock('react-router-dom');
    renderHome({ forgottenPassword: true });
    expect(Navigate).toHaveBeenCalled();
  });
});

describe('Home — notification popup closing', () => {
  it('renders nothing when notification popup should close', () => {
    jest
      .spyOn(
        jest.requireActual('../../../shared/lib/environment-type'),
        'getEnvironmentType',
      )
      .mockReturnValue(ENVIRONMENT_TYPE_NOTIFICATION);

    const store = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        isUnlocked: true,
        completedOnboarding: true,
        pendingApprovalCount: 0,
        approvalFlows: [],
      },
      appState: {
        ...mockState.appState,
        modal: {
          modalState: {
            name: null,
          },
        },
      },
    });

    const { container } = renderWithProvider(<Home />, store);
    expect(container.firstChild).toBeNull();
  });
});
