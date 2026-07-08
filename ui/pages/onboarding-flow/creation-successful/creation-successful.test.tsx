import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import {
  DEFAULT_ROUTE,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
  SECURITY_AND_PASSWORD_ROUTE,
} from '../../../helpers/constants/routes';
import * as useSidePanelEnabledHook from '../../../hooks/useSidePanelEnabled';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { useOnboardingCompletion } from '../hooks/useOnboardingCompletion';
import CreationSuccessful from './creation-successful';

jest.mock('../hooks/useOnboardingCompletion');

const mockCompleteOnboardingFromCompletionPage = jest
  .fn()
  .mockResolvedValue(undefined);
const mockMarkCompletionPageSeen = jest.fn();
const mockSetIsSidePanelOpen = jest.fn();

const mockUseOnboardingCompletion = useOnboardingCompletion as jest.Mock;

const mockUseNavigate = jest.fn();
let mockUseLocationSearch = '';

jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => ({ search: mockUseLocationSearch }),
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
  sidePanel: {
    onClosed: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
}));

jest.mock('../../../hooks/useSidePanelEnabled');

describe('Wallet Ready Page', () => {
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
      hasSeenOnboardingCompletionPage: false,
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
    mockUseOnboardingCompletion.mockReturnValue({
      completeOnboardingFromCompletionPage:
        mockCompleteOnboardingFromCompletionPage,
      markCompletionPageSeen: mockMarkCompletionPageSeen,
      isSidePanelOpen: false,
      setIsSidePanelOpen: mockSetIsSidePanelOpen,
    });
    (useSidePanelEnabledHook.useSidePanelEnabled as jest.Mock).mockReturnValue(
      false,
    );
  });

  it('marks the onboarding completion page as seen on first visit', async () => {
    const mockStore = configureMockStore([thunk])(mockState);
    renderWithProvider(<CreationSuccessful />, mockStore);

    await waitFor(() => {
      expect(mockMarkCompletionPageSeen).toHaveBeenCalled();
    });
  });

  it('does not mark the onboarding completion page as seen when from reminder', () => {
    const previousSearch = mockUseLocationSearch;
    mockUseLocationSearch = '?isFromReminder=true';

    try {
      const mockStore = configureMockStore([thunk])(mockState);
      renderWithProvider(<CreationSuccessful />, mockStore);
      expect(mockMarkCompletionPageSeen).not.toHaveBeenCalled();
    } finally {
      mockUseLocationSearch = previousSearch;
    }
  });

  it('renders the wallet ready content if the seed phrase is backed up', () => {
    const mockStore = configureMockStore([thunk])(mockState);
    const { getByText } = renderWithProvider(<CreationSuccessful />, mockStore);

    expect(getByText(messages.yourWalletIsReady.message)).toBeInTheDocument();
  });

  it('renders the wallet ready content if the seed phrase is not backed up', () => {
    const mockStore = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        seedPhraseBackedUp: false,
      },
    });
    const { getByText } = renderWithProvider(<CreationSuccessful />, mockStore);

    expect(getByText(messages.yourWalletIsReady.message)).toBeInTheDocument();
  });

  it('redirects to privacy-settings view when "Manage default settings" button is clicked', () => {
    const mockStore = configureMockStore([thunk])(mockState);
    const { getByText } = renderWithProvider(<CreationSuccessful />, mockStore);
    const privacySettingsButton = getByText(
      messages.manageDefaultSettings.message,
    );
    fireEvent.click(privacySettingsButton);
    expect(mockUseNavigate).toHaveBeenCalledWith(
      ONBOARDING_PRIVACY_SETTINGS_ROUTE,
    );
  });

  it('opens learn more link in new tab when "Learn how" is clicked (from SRP backup reminder)', () => {
    const openTabMock = jest.fn();
    const previousSearch = mockUseLocationSearch;
    const previousPlatform = global.platform;

    mockUseLocationSearch = '?isFromReminder=true';
    global.platform = { openTab: openTabMock } as never;

    try {
      const mockStore = configureMockStore([thunk])(mockState);
      const { getByText } = renderWithProvider(
        <CreationSuccessful />,
        mockStore,
      );
      const learnHowButton = getByText(messages.learnHow.message);
      fireEvent.click(learnHowButton);
      expect(openTabMock).toHaveBeenCalledTimes(1);
      expect(openTabMock).toHaveBeenCalledWith({
        url: ZENDESK_URLS.BASIC_SAFETY_TIPS,
      });
    } finally {
      mockUseLocationSearch = previousSearch;
      global.platform = previousPlatform;
    }
  });

  it('delegates onboarding completion to the shared hook when "Done" is clicked', async () => {
    const mockStore = configureMockStore([thunk])(mockState);
    const { getByTestId } = renderWithProvider(
      <CreationSuccessful />,
      mockStore,
    );

    fireEvent.click(getByTestId('onboarding-complete-done'));

    await waitFor(() => {
      expect(mockCompleteOnboardingFromCompletionPage).toHaveBeenCalledTimes(1);
    });
  });

  it('navigates away without completing onboarding when from reminder', async () => {
    const previousSearch = mockUseLocationSearch;
    mockUseLocationSearch = '?isFromReminder=true';

    try {
      const mockStore = configureMockStore([thunk])(mockState);
      const { getByTestId } = renderWithProvider(
        <CreationSuccessful />,
        mockStore,
      );

      fireEvent.click(getByTestId('onboarding-complete-done'));

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
      });
      expect(mockCompleteOnboardingFromCompletionPage).not.toHaveBeenCalled();
    } finally {
      mockUseLocationSearch = previousSearch;
    }
  });

  it('navigates to security settings when done from reminder via settings security', async () => {
    const previousSearch = mockUseLocationSearch;
    mockUseLocationSearch = '?isFromReminder=true&isFromSettingsSecurity=true';

    try {
      const mockStore = configureMockStore([thunk])(mockState);
      const { getByTestId } = renderWithProvider(
        <CreationSuccessful />,
        mockStore,
      );

      fireEvent.click(getByTestId('onboarding-complete-done'));

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(
          SECURITY_AND_PASSWORD_ROUTE,
        );
      });
      expect(mockCompleteOnboardingFromCompletionPage).not.toHaveBeenCalled();
    } finally {
      mockUseLocationSearch = previousSearch;
    }
  });

  it('redirects to default route when wallet is not initialized', () => {
    const mockStore = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        isInitialized: false,
        isUnlocked: false,
      },
    });
    renderWithProvider(<CreationSuccessful />, mockStore);
    expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
      replace: true,
    });
  });

  it('disables the done button while the side panel is open', () => {
    (useSidePanelEnabledHook.useSidePanelEnabled as jest.Mock).mockReturnValue(
      true,
    );
    mockUseOnboardingCompletion.mockReturnValue({
      completeOnboardingFromCompletionPage:
        mockCompleteOnboardingFromCompletionPage,
      markCompletionPageSeen: mockMarkCompletionPageSeen,
      isSidePanelOpen: true,
      setIsSidePanelOpen: mockSetIsSidePanelOpen,
    });

    const mockStore = configureMockStore([thunk])(mockState);
    const { getByTestId } = renderWithProvider(
      <CreationSuccessful />,
      mockStore,
    );

    expect(getByTestId('onboarding-complete-done')).toBeDisabled();
  });
});
