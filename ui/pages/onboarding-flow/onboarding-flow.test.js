import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../test/lib/render-helpers';
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
import OnboardingFlow from './onboarding-flow';

jest.mock('../../store/actions', () => ({
  createNewVaultAndGetSeedPhrase: jest.fn().mockResolvedValue(null),
  unlockAndGetSeedPhrase: jest.fn().mockResolvedValue(null),
  createNewVaultAndRestore: jest.fn(),
  setOnboardingDate: jest.fn(() => ({ type: 'TEST_DISPATCH' })),
}));

describe('Onboarding Flow', () => {
  const mockState = {
    metamask: {
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
      ...mockNetworkState({ chainId: CHAIN_IDS.GOERLI }),

      incomingTransactionsPreferences: {
        [CHAIN_IDS.MAINNET]: true,
      },
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
      },
    };

    const completedOnboardingStore = configureMockStore()(
      completedOnboardingState,
    );

    const { history } = renderWithProvider(
      <OnboardingFlow />,
      completedOnboardingStore,
      '/other',
    );

    expect(history.location.pathname).toStrictEqual(DEFAULT_ROUTE);
  });

  describe('Create Password', () => {
    it('should render create password', () => {
      const { queryByTestId } = renderWithProvider(
        <OnboardingFlow />,
        store,
        ONBOARDING_CREATE_PASSWORD_ROUTE,
      );

      const createPassword = queryByTestId('create-password');
      expect(createPassword).toBeInTheDocument();
    });

    it('should call createNewVaultAndGetSeedPhrase when creating a new wallet password', async () => {
      const { queryByTestId } = renderWithProvider(
        <OnboardingFlow />,
        store,
        ONBOARDING_CREATE_PASSWORD_ROUTE,
      );

      const password = 'a-new-password';
      const checkTerms = queryByTestId('create-password-terms');
      const createPassword = queryByTestId('create-password-new');
      const confirmPassword = queryByTestId('create-password-confirm');
      const createPasswordWallet = queryByTestId('create-password-wallet');

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
    const { queryByTestId } = renderWithProvider(
      <OnboardingFlow />,
      store,
      ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
    );

    const secureYourWallet = queryByTestId('secure-your-wallet');
    expect(secureYourWallet).toBeInTheDocument();
  });

  it('should render review recovery phrase', () => {
    const { queryByTestId } = renderWithProvider(
      <OnboardingFlow />,
      store,
      ONBOARDING_REVIEW_SRP_ROUTE,
    );

    const recoveryPhrase = queryByTestId('recovery-phrase');
    expect(recoveryPhrase).toBeInTheDocument();
  });

  it('should render confirm recovery phrase', () => {
    const { queryByTestId } = renderWithProvider(
      <OnboardingFlow />,
      store,
      ONBOARDING_CONFIRM_SRP_ROUTE,
    );

    const confirmRecoveryPhrase = queryByTestId('confirm-recovery-phrase');
    expect(confirmRecoveryPhrase).toBeInTheDocument();
  });

  it('should render import seed phrase', () => {
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
      const { queryByTestId } = renderWithProvider(
        <OnboardingFlow />,
        store,
        ONBOARDING_UNLOCK_ROUTE,
      );

      const unlockPage = queryByTestId('unlock-page');
      expect(unlockPage).toBeInTheDocument();
    });

    it('should', async () => {
      const { getByLabelText, getByText } = renderWithProvider(
        <OnboardingFlow />,
        store,
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

    const creationSuccessful = queryByTestId('creation-successful');
    expect(creationSuccessful).toBeInTheDocument();
  });

  it('should render onboarding welcome screen', () => {
    const { queryByTestId } = renderWithProvider(
      <OnboardingFlow />,
      store,
      ONBOARDING_WELCOME_ROUTE,
    );

    const onboardingWelcome = queryByTestId('onboarding-welcome');
    expect(onboardingWelcome).toBeInTheDocument();
  });

  it('should render onboarding pin extension screen', () => {
    const { queryByTestId } = renderWithProvider(
      <OnboardingFlow />,
      store,
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
