import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import * as deepLinkUtils from '../../../../shared/lib/deep-links/utils';
import * as useSidePanelEnabledHook from '../../../hooks/useSidePanelEnabled';
import { setBackgroundConnection } from '../../../store/background-connection';
import OnboardingCompletionRoute from './onboarding-completion-route';

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: jest.fn(),
      createEventBuilder,
    }),
  };
});

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => ({ search: '' }),
  };
});

jest.mock('./wallet-ready-animation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => <div data-testid="wallet-ready-animation" />,
}));

jest.mock('../../../components/component-library/lottie-animation', () => ({
  LottieAnimation: () => <div data-testid="lottie-fox" />,
}));

jest.mock('webextension-polyfill', () => ({
  tabs: {
    query: jest.fn(),
  },
  sidePanel: {
    open: jest.fn(),
    onClosed: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
}));

jest.mock('../../../../shared/lib/deep-links/utils');
jest.mock('../../../hooks/useSidePanelEnabled');

const mockRemoveDeferredDeepLink = jest.fn().mockResolvedValue(undefined);
const mockSetIsBackupAndSyncFeatureEnabled = jest
  .fn()
  .mockResolvedValue(undefined);
const mockToggleExternalServices = jest.fn().mockResolvedValue(undefined);
const mockSetHasSeenOnboardingCompletionPage = jest
  .fn()
  .mockResolvedValue(undefined);
const mockCompleteOnboarding = jest.fn().mockResolvedValue(true);
const backgroundConnectionMock = new Proxy(
  {
    removeDeferredDeepLink: mockRemoveDeferredDeepLink,
    setIsBackupAndSyncFeatureEnabled: mockSetIsBackupAndSyncFeatureEnabled,
    toggleExternalServices: mockToggleExternalServices,
    setHasSeenOnboardingCompletionPage: mockSetHasSeenOnboardingCompletionPage,
    completeOnboarding: mockCompleteOnboarding,
  },
  {
    get: (target, prop) => {
      if (prop in target) {
        return target[prop as keyof typeof target];
      }
      return jest.fn().mockResolvedValue(undefined);
    },
  },
);

describe('OnboardingCompletionRoute', () => {
  const mockState = {
    metamask: {
      internalAccounts: {
        accounts: {
          accountId: {
            address: '0x0000000000000000000000000000000000000000',
            metadata: {
              keyring: {
                type: 'HD Key Tree',
                accounts: ['0x0000000000000000000000000000000000000000'],
              },
            },
          },
        },
        selectedAccount: 'accountId',
      },
      keyrings: [
        {
          type: 'HD Key Tree',
          accounts: ['0x0000000000000000000000000000000000000000'],
        },
      ],
      firstTimeFlowType: FirstTimeFlowType.create,
      seedPhraseBackedUp: true,
      isInitialized: true,
      isUnlocked: true,
      completedOnboarding: false,
      hasSeenOnboardingCompletionPage: true,
      deferredDeepLink: null,
    },
    appState: {
      externalServicesOnboardingToggleState: true,
      backupAndSyncOnboardingToggleState: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockClear();
    setBackgroundConnection(backgroundConnectionMock as never);
    (
      useSidePanelEnabledHook.useSidePanelEnabled as jest.Mock
    ).mockReturnValue(false);
    (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue(
      null,
    );
  });

  it('auto-completes onboarding when shouldAutoComplete is true', async () => {
    const mockStore = configureMockStore([thunk])(mockState);

    renderWithProvider(
      <OnboardingCompletionRoute shouldAutoComplete />,
      mockStore,
    );

    await waitFor(() => {
      expect(mockToggleExternalServices).toHaveBeenCalledWith(true);
      expect(mockCompleteOnboarding).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });
  });

  it('renders the completion page when shouldAutoComplete is false', () => {
    const mockStore = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        hasSeenOnboardingCompletionPage: false,
      },
    });

    const { getByTestId } = renderWithProvider(
      <OnboardingCompletionRoute shouldAutoComplete={false} />,
      mockStore,
    );

    expect(getByTestId('wallet-ready')).toBeInTheDocument();
  });
});
