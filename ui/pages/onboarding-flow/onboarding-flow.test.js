import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  ONBOARDING_EXPERIMENTAL_AREA,
  ///: END:ONLY_INCLUDE_IF
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_CONFIRM_SRP_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
  DEFAULT_ROUTE,
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  ONBOARDING_PIN_EXTENSION_ROUTE,
  ONBOARDING_METAMETRICS,
} from '../../helpers/constants/routes';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  createNewVaultAndGetSeedPhrase,
  unlockAndGetSeedPhrase,
} from '../../store/actions';
import { mockNetworkState } from '../../../test/stub/networks';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import OnboardingFlow from './onboarding-flow';

const mockNavigate = jest.fn();
const mockUseNavigate = jest.fn(() => mockNavigate);
const mockUseLocation = jest.fn();

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockUseNavigate(),
  useLocation: () => mockUseLocation(),
}));

jest.mock('../../store/actions', () => ({
  createNewVaultAndGetSeedPhrase: jest.fn().mockResolvedValue(null),
  unlockAndGetSeedPhrase: jest.fn().mockResolvedValue(null),
  createNewVaultAndRestore: jest.fn(),
  setOnboardingDate: jest.fn(() => ({ type: 'TEST_DISPATCH' })),
  hideLoadingIndication: jest.fn(() => ({ type: 'HIDE_LOADING_INDICATION' })),
}));

describe('Onboarding Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({
      pathname: '/onboarding',
      search: '',
    });
  });

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

  const store = configureMockStore()(mockState);

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

    const completedOnboardingStore = configureMockStore()(
      completedOnboardingState,
    );

    renderWithProvider(<OnboardingFlow />, completedOnboardingStore, '/other');

    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  describe('Create Password', () => {
    it('should render create password', () => {
      mockUseLocation.mockReturnValue({
        pathname: ONBOARDING_CREATE_PASSWORD_ROUTE,
        search: '',
      });

      const { queryByTestId } = renderWithProvider(
        <OnboardingFlow />,
        store,
        ONBOARDING_CREATE_PASSWORD_ROUTE,
      );

      const createPassword = queryByTestId('create-password');
      expect(createPassword).toBeInTheDocument();
    });

    it('should call createNewVaultAndGetSeedPhrase when creating a new wallet password', async () => {
      mockUseLocation.mockReturnValue({
        pathname: ONBOARDING_CREATE_PASSWORD_ROUTE,
        search: '',
      });

      const { queryByTestId, queryByText } = renderWithProvider(
        <OnboardingFlow />,
        configureMockStore()({
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

      fireEvent.click(checkTerms);
      fireEvent.change(createPassword, { target: { value: password } });
      fireEvent.change(confirmPassword, { target: { value: password } });
      fireEvent.click(createPasswordWallet);

      await waitFor(() =>
        expect(createNewVaultAndGetSeedPhrase).toHaveBeenCalled(),
      );
    });
  });

  it('should render secure your wallet component', () => {
    mockUseLocation.mockReturnValue({
      pathname: ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
      search: '',
    });

    const { queryByTestId } = renderWithProvider(
      <OnboardingFlow />,
      store,
      ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
    );

    const secureYourWallet = queryByTestId('secure-your-wallet');
    expect(secureYourWallet).toBeInTheDocument();
  });

  it('should redirect to unlock route when going to review recovery phrase without srp and user is unlocked', () => {
    mockUseLocation.mockReturnValue({
      pathname: ONBOARDING_REVIEW_SRP_ROUTE,
      search: '',
    });

    const unlockedState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        isUnlocked: true,
        completedOnboarding: false,
      },
    };

    const unlockedStore = configureMockStore()(unlockedState);
    renderWithProvider(
      <OnboardingFlow />,
      unlockedStore,
      ONBOARDING_REVIEW_SRP_ROUTE,
    );

    expect(mockNavigate).toHaveBeenCalledWith(ONBOARDING_UNLOCK_ROUTE);
  });

  it('should redirect to unlock route when going to confirm recovery phrase without srp and user is unlocked', () => {
    mockUseLocation.mockReturnValue({
      pathname: ONBOARDING_CONFIRM_SRP_ROUTE,
      search: '',
    });

    const unlockedState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        isUnlocked: true,
        completedOnboarding: false,
      },
    };

    const unlockedStore = configureMockStore()(unlockedState);
    renderWithProvider(
      <OnboardingFlow />,
      unlockedStore,
      ONBOARDING_CONFIRM_SRP_ROUTE,
    );

    expect(mockNavigate).toHaveBeenCalledWith(ONBOARDING_UNLOCK_ROUTE);
  });

  it('should render import seed phrase', () => {
    mockUseLocation.mockReturnValue({
      pathname: ONBOARDING_IMPORT_WITH_SRP_ROUTE,
      search: '',
    });

    const { queryByTestId } = renderWithProvider(
      <OnboardingFlow />,
      store,
      ONBOARDING_IMPORT_WITH_SRP_ROUTE,
    );

    const importSrp = queryByTestId('import-srp');
    expect(importSrp).toBeInTheDocument();
  });

  describe('Unlock Screen', () => {
    it('should render unlock page', () => {
      mockUseLocation.mockReturnValue({
        pathname: ONBOARDING_UNLOCK_ROUTE,
        search: '',
      });

      const { queryByTestId } = renderWithProvider(
        <OnboardingFlow />,
        store,
        ONBOARDING_UNLOCK_ROUTE,
      );

      const unlockPage = queryByTestId('unlock-page');
      expect(unlockPage).toBeInTheDocument();
    });

    it('should call unlockAndGetSeedPhrase when unlocking with a password', async () => {
      mockUseLocation.mockReturnValue({
        pathname: ONBOARDING_UNLOCK_ROUTE,
        search: '',
      });

      const { getByLabelText, getByText } = renderWithProvider(
        <OnboardingFlow />,
        configureMockStore()({
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
      <OnboardingFlow />,
      store,
      ONBOARDING_PRIVACY_SETTINGS_ROUTE,
    );

    const privacySettings = queryByTestId('privacy-settings');
    expect(privacySettings).toBeInTheDocument();
  });

  it('should render onboarding creation/completion successful', () => {
    const { queryByTestId } = renderWithProvider(
      <OnboardingFlow />,
      store,
      ONBOARDING_COMPLETION_ROUTE,
    );

    const creationSuccessful = queryByTestId('wallet-ready');
    expect(creationSuccessful).toBeInTheDocument();
  });

  it('should render onboarding welcome screen', () => {
    mockUseLocation.mockReturnValue({
      pathname: ONBOARDING_WELCOME_ROUTE,
      search: '',
    });

    const { queryByTestId } = renderWithProvider(
      <OnboardingFlow />,
      store,
      ONBOARDING_WELCOME_ROUTE,
    );

    const onboardingWelcome = queryByTestId('onboarding-welcome-banner-title');
    expect(onboardingWelcome).toBeInTheDocument();
  });

  it('should render onboarding pin extension screen', () => {
    const mockStateWithCurrentKeyring = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
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
      },
    };

    const mockStoreWithCurrentKeyring = configureMockStore()(
      mockStateWithCurrentKeyring,
    );

    const { queryByTestId } = renderWithProvider(
      <OnboardingFlow />,
      mockStoreWithCurrentKeyring,
      ONBOARDING_PIN_EXTENSION_ROUTE,
    );

    const pinExtension = queryByTestId('onboarding-pin-extension');
    expect(pinExtension).toBeInTheDocument();
  });

  it('should render onboarding metametrics screen', () => {
    const { queryByTestId } = renderWithProvider(
      <OnboardingFlow />,
      store,
      ONBOARDING_METAMETRICS,
    );

    const onboardingMetametrics = queryByTestId('onboarding-metametrics');
    expect(onboardingMetametrics).toBeInTheDocument();
  });

  it('should render onboarding experimental screen', () => {
    const { queryByTestId } = renderWithProvider(
      <OnboardingFlow />,
      store,
      ONBOARDING_EXPERIMENTAL_AREA,
    );

    const onboardingMetametrics = queryByTestId('experimental-area');
    expect(onboardingMetametrics).toBeInTheDocument();
  });
});
