import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Routes, Route } from 'react-router-dom';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import {
  ONBOARDING_EXPERIMENTAL_AREA,
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_CONFIRM_SRP_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
  DEFAULT_ROUTE,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_REVEAL_SRP_ROUTE,
  ONBOARDING_ROUTE,
} from '../../helpers/constants/routes';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  createNewVaultAndGetSeedPhrase,
  unlockAndGetSeedPhrase,
} from '../../store/actions';
import { mockNetworkState } from '../../../test/stub/networks';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import OnboardingFlow from './onboarding-flow';

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

// Wrapper component that provides proper route context for nested Routes
// OnboardingFlow uses relative paths expecting to be mounted at /onboarding/*
const OnboardingFlowWithRouteContext = () => (
  <Routes>
    <Route path={`${ONBOARDING_ROUTE}/*`} element={<OnboardingFlow />} />
  </Routes>
);

// Mock Rive animation components
jest.mock('./welcome/fox-appear-animation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => <div data-testid="fox-appear-animation" />,
}));

jest.mock('./welcome/metamask-wordmark-animation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: ({
    setIsAnimationComplete,
  }: {
    setIsAnimationComplete: (isAnimationComplete: boolean) => void;
  }) => {
    // Simulate animation completion immediately using setTimeout
    setTimeout(() => setIsAnimationComplete(true), 0);
    return <div data-testid="metamask-wordmark-animation" />;
  },
}));

jest.mock('./creation-successful/wallet-ready-animation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => <div data-testid="wallet-ready-animation" />,
}));

// Mock the useBackupAndSync hook to avoid thunk dispatch issues
jest.mock('../../hooks/identity/useBackupAndSync', () => ({
  useBackupAndSync: () => ({
    error: null,
    setIsBackupAndSyncFeatureEnabled: jest.fn(() => Promise.resolve()),
  }),
}));

jest.mock('../../store/actions', () => ({
  createNewVaultAndGetSeedPhrase: jest.fn().mockResolvedValue(null),
  unlockAndGetSeedPhrase: jest.fn().mockResolvedValue(null),
  createNewVaultAndRestore: jest.fn(),
  setOnboardingDate: jest.fn(() => ({ type: 'TEST_DISPATCH' })),
  hideLoadingIndication: jest.fn(() => async () => ({
    type: 'HIDE_LOADING_INDICATION',
  })),
  setIsBackupAndSyncFeatureEnabled: jest.fn(
    () => async () => Promise.resolve(),
  ),
  checkIsSeedlessPasswordOutdated: jest.fn(() => Promise.resolve()),
  getIsSeedlessOnboardingUserAuthenticated: jest.fn(() => Promise.resolve()),
}));

describe('Onboarding Flow', () => {
  const mockState = {
    metamask: {
      internalAccounts: {
        accounts: {
          accountId: {
            address: '0x0000000000000000000000000000000000000000',
            metadata: {
              keyring: 'HD Key Tree',
            },
          },
        },
        selectedAccount: '',
      },
      keyrings: [
        {
          type: 'HD Key Tree',
          accounts: ['0x0000000000000000000000000000000000000000'],
        },
      ],
      ...mockNetworkState(
        { chainId: CHAIN_IDS.GOERLI },
        { chainId: CHAIN_IDS.MAINNET },
        { chainId: CHAIN_IDS.LINEA_MAINNET },
      ),
      preferences: {
        petnamesEnabled: true,
      },
    },
    localeMessages: {
      currentLocale: 'en',
    },
    appState: {
      externalServicesOnboardingToggleState: true,
    },
  };

  process.env.METAMASK_BUILD_TYPE = 'main';

  const store = configureMockStore([thunk])(mockState);

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should route to the default route when completedOnboarding and seedPhraseBackedUp is true', () => {
    const completedOnboardingState = {
      metamask: {
        completedOnboarding: true,
        seedPhraseBackedUp: true,
        internalAccounts: {
          accounts: {
            accountId: {
              address: '0x0000000000000000000000000000000000000000',
              metadata: {
                keyring: 'HD Key Tree',
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
      },
      localeMessages: {
        currentLocale: 'en',
      },
    };

    const completedOnboardingStore = configureMockStore([thunk])(
      completedOnboardingState,
    );

    renderWithProvider(
      <OnboardingFlowWithRouteContext />,
      completedOnboardingStore,
      ONBOARDING_ROUTE,
    );

    expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
      replace: true,
    });
  });

  describe('Create Password', () => {
    it('should render create password', () => {
      const { queryByTestId } = renderWithProvider(
        <OnboardingFlowWithRouteContext />,
        store,
        ONBOARDING_CREATE_PASSWORD_ROUTE,
      );

      const createPassword = queryByTestId('create-password');
      expect(createPassword).toBeInTheDocument();
    });

    it('should call createNewVaultAndGetSeedPhrase when creating a new wallet password', async () => {
      const { queryByTestId, queryByText } = renderWithProvider(
        <OnboardingFlowWithRouteContext />,
        configureMockStore([thunk])({
          ...mockState,
          metamask: {
            ...mockState.metamask,
            firstTimeFlowType: FirstTimeFlowType.create,
          },
        }),
        ONBOARDING_CREATE_PASSWORD_ROUTE,
      );

      const createPasswordText = queryByText('MetaMask password');
      expect(createPasswordText).toBeInTheDocument();

      const password = 'a-new-password';
      const checkTerms = queryByTestId('create-password-terms');
      const createPassword = queryByTestId('create-password-new-input');
      const confirmPassword = queryByTestId('create-password-confirm-input');
      const createPasswordWallet = queryByTestId('create-password-submit');

      fireEvent.click(checkTerms as HTMLElement);
      fireEvent.change(createPassword as HTMLElement, {
        target: { value: password },
      });
      fireEvent.change(confirmPassword as HTMLElement, {
        target: { value: password },
      });
      fireEvent.click(createPasswordWallet as HTMLElement);

      await waitFor(() =>
        expect(createNewVaultAndGetSeedPhrase).toHaveBeenCalled(),
      );
    });
  });

  it('should redirect to reveal recovery phrase when going to review recovery phrase without srp', () => {
    renderWithProvider(
      <OnboardingFlowWithRouteContext />,
      store,
      ONBOARDING_REVIEW_SRP_ROUTE,
    );

    expect(mockUseNavigate).toHaveBeenCalledWith(
      {
        pathname: ONBOARDING_REVEAL_SRP_ROUTE,
        search: '',
      },
      { replace: true },
    );
  });

  it('should redirect to reveal recovery phrase when going to confirm recovery phrase without srp', () => {
    renderWithProvider(
      <OnboardingFlowWithRouteContext />,
      store,
      ONBOARDING_CONFIRM_SRP_ROUTE,
    );

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${ONBOARDING_REVEAL_SRP_ROUTE}`,
      { replace: true },
    );
  });

  it('should render import seed phrase', () => {
    const { queryByTestId } = renderWithProvider(
      <OnboardingFlowWithRouteContext />,
      store,
      ONBOARDING_IMPORT_WITH_SRP_ROUTE,
    );

    const importSrp = queryByTestId('import-srp');
    expect(importSrp).toBeInTheDocument();
  });

  describe('Unlock Screen', () => {
    it('should render unlock page', () => {
      const { queryByTestId } = renderWithProvider(
        <OnboardingFlowWithRouteContext />,
        store,
        ONBOARDING_UNLOCK_ROUTE,
      );

      const unlockPage = queryByTestId('unlock-page');
      expect(unlockPage).toBeInTheDocument();
    });

    it('should call unlockAndGetSeedPhrase when unlocking with a password', async () => {
      const { getByLabelText, getByText } = renderWithProvider(
        <OnboardingFlowWithRouteContext />,
        configureMockStore([thunk])({
          ...mockState,
          metamask: {
            ...mockState.metamask,
            firstTimeFlowType: FirstTimeFlowType.import,
          },
        }),
        ONBOARDING_UNLOCK_ROUTE,
      );

      const password = 'a-new-password';
      const inputPassword = getByLabelText('Password');
      const unlockButton = getByText('Unlock');

      fireEvent.change(inputPassword, { target: { value: password } });
      fireEvent.click(unlockButton);
      await waitFor(() => expect(unlockAndGetSeedPhrase).toHaveBeenCalled());
    });
  });

  it('should render privacy settings', () => {
    const { queryByTestId } = renderWithProvider(
      <OnboardingFlowWithRouteContext />,
      store,
      ONBOARDING_PRIVACY_SETTINGS_ROUTE,
    );

    const privacySettings = queryByTestId('privacy-settings');
    expect(privacySettings).toBeInTheDocument();
  });

  it('should render onboarding creation/completion successful', async () => {
    const { queryByTestId } = renderWithProvider(
      <OnboardingFlowWithRouteContext />,
      store,
      ONBOARDING_COMPLETION_ROUTE,
    );

    await waitFor(() => {
      const creationSuccessful = queryByTestId('wallet-ready');
      expect(creationSuccessful).toBeInTheDocument();
    });
  });

  it('should render onboarding Login page screen', async () => {
    const { queryByTestId } = renderWithProvider(
      <OnboardingFlowWithRouteContext />,
      store,
      ONBOARDING_WELCOME_ROUTE,
    );

    await waitFor(() => {
      expect(queryByTestId('get-started')).toBeInTheDocument();
    });
  });

  it('should render onboarding metametrics screen', () => {
    const { queryByTestId } = renderWithProvider(
      <OnboardingFlowWithRouteContext />,
      store,
      ONBOARDING_METAMETRICS,
    );

    const onboardingMetametrics = queryByTestId('onboarding-metametrics');
    expect(onboardingMetametrics).toBeInTheDocument();
  });

  it('should render onboarding experimental screen', () => {
    const { queryByTestId } = renderWithProvider(
      <OnboardingFlowWithRouteContext />,
      store,
      ONBOARDING_EXPERIMENTAL_AREA,
    );

    const onboardingMetametrics = queryByTestId('experimental-area');
    expect(onboardingMetametrics).toBeInTheDocument();
  });
});
