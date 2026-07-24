import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import initializedMockState from '../../../../test/data/mock-send-state.json';
import {
  ONBOARDING_METAMETRICS,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_DOWNLOAD_APP_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_SETUP_PASSKEY_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { getIsPasskeyFeatureEnabled } from '../../../../shared/lib/environment';
import * as Actions from '../../../store/actions';
import { setBackgroundConnection } from '../../../store/background-connection';
import CreatePassword from './create-password';

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

jest.mock('../../../hooks/useIsFirefox', () => ({
  useIsFirefox: jest.fn().mockReturnValue(false),
}));

const { useIsFirefox } = jest.requireMock('../../../hooks/useIsFirefox');

jest.mock('../../../../shared/lib/passkey', () => ({
  isWebAuthnSupported: jest.fn().mockReturnValue(true),
}));

jest.mock('../../../../shared/lib/environment', () => ({
  ...jest.requireActual('../../../../shared/lib/environment'),
  getIsPasskeyFeatureEnabled: jest.fn().mockReturnValue(true),
}));

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

const getWalletSetupCompletedEvent = () => {
  return mockTrackEvent.mock.calls.find(
    (args) => args[0]?.name === MetaMetricsEventName.WalletSetupCompleted,
  )?.[0];
};

const backgroundConnectionMock = new Proxy(
  {},
  {
    get: () => jest.fn().mockResolvedValue(undefined),
  },
);

describe('Onboarding Create Password', () => {
  const mockState = {
    confirmTransaction: {
      txData: {},
    },
    metamask: {
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
      analyticsId: '0x00000000',
    },
  };

  const mockCreateNewAccount = jest.fn().mockResolvedValue('');
  const mockImportWithRecoveryPhrase = jest.fn().mockResolvedValue('');

  beforeEach(() => {
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialized State Conditionals with keyrings and firstTimeFlowType', () => {
    it('should route to secure your wallet when keyring is present but not imported first time flow type', () => {
      const createFirstTimeFlowWithPasskeyState = {
        ...initializedMockState,
        metamask: {
          ...initializedMockState.metamask,
          passkeyRecord: {
            credentialId: 'cred',
            derivationMethod: 'prf',
            wrappedEncryptionKey: 'e30',
            iv: 'e30',
          },
        },
      };
      const mockStore = configureMockStore([thunk])(
        createFirstTimeFlowWithPasskeyState,
      );

      renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        mockStore,
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_REVIEW_SRP_ROUTE,
        { replace: true },
      );
    });

    it('should route to setup passkey when keyring is present and imported first time flow type and passkey is not registered', () => {
      const importFirstTimeFlowState = {
        ...initializedMockState,
        metamask: {
          ...initializedMockState.metamask,
          firstTimeFlowType: FirstTimeFlowType.import,
          completedMetaMetricsOnboarding: false,
          optedIn: false,
          passkeyRecord: null,
        },
      };
      const mockStore = configureMockStore([thunk])(importFirstTimeFlowState);

      renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        mockStore,
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_SETUP_PASSKEY_ROUTE,
        { replace: true },
      );
    });

    it('should route to setup passkey when keyring is present and imported first time flow type (passkey already registered)', () => {
      const importFirstTimeFlowState = {
        ...initializedMockState,
        metamask: {
          ...initializedMockState.metamask,
          firstTimeFlowType: FirstTimeFlowType.import,
          completedMetaMetricsOnboarding: false,
          optedIn: false,
          passkeyRecord: {
            credentialId: 'cred',
            derivationMethod: 'prf',
            wrappedEncryptionKey: 'e30',
            iv: 'e30',
          },
        },
      };
      const mockStore = configureMockStore([thunk])(importFirstTimeFlowState);

      renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        mockStore,
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_SETUP_PASSKEY_ROUTE,
        { replace: true },
      );
    });

    it('should route to setup passkey when user has imported SRP, metametrics set, and passkey already registered', () => {
      const importFirstTimeFlowState = {
        ...initializedMockState,
        metamask: {
          ...initializedMockState.metamask,
          firstTimeFlowType: FirstTimeFlowType.import,
          completedMetaMetricsOnboarding: true,
          optedIn: true,
          passkeyRecord: {
            credentialId: 'cred',
            derivationMethod: 'prf',
            wrappedEncryptionKey: 'e30',
            iv: 'e30',
          },
        },
      };
      const mockStore = configureMockStore([thunk])(importFirstTimeFlowState);
      renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        mockStore,
      );

      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_SETUP_PASSKEY_ROUTE,
        { replace: true },
      );
    });
  });

  describe('Render', () => {
    it('should match snapshot', () => {
      const mockStore = configureMockStore([thunk])(mockState);
      const { container } = renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        mockStore,
      );

      expect(container).toMatchSnapshot();
    });
  });

  describe('Password Validation Checks', () => {
    it('should show password as text when click Show under password', () => {
      const mockStore = configureMockStore([thunk])(mockState);
      const { queryByTestId } = renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        mockStore,
      );

      const createPasswordInput = queryByTestId('create-password-new-input');
      const event = {
        target: {
          value: '1234567',
        },
      };

      fireEvent.change(createPasswordInput as HTMLElement, event);
      expect(createPasswordInput).toHaveAttribute('type', 'password');

      const showPassword = queryByTestId('show-password');

      fireEvent.click(showPassword as HTMLElement);
      expect(createPasswordInput).toHaveAttribute('type', 'text');
    });

    it('should disable create new account button and show short password error with password length of 7', () => {
      const mockStore = configureMockStore([thunk])(mockState);
      const { queryByTestId } = renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        mockStore,
      );

      const createPasswordInput = queryByTestId('create-password-new-input');
      const event = {
        target: {
          value: '1234567',
        },
      };

      fireEvent.change(createPasswordInput as HTMLElement, event);

      const shortPasswordError = queryByTestId('short-password-error');
      expect(shortPasswordError).toBeInTheDocument();

      const createNewWalletButton = queryByTestId('create-password-submit');

      expect(createNewWalletButton).toBeDisabled();

      fireEvent.click(createNewWalletButton as HTMLElement);
      expect(mockCreateNewAccount).not.toHaveBeenCalled();
    });

    it('should show mismatch password error', () => {
      const mockStore = configureMockStore([thunk])(mockState);
      const { queryByTestId, queryByText } = renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        mockStore,
      );

      const createPasswordInput = queryByTestId('create-password-new-input');
      const confirmPasswordInput = queryByTestId(
        'create-password-confirm-input',
      );

      const createPasswordEvent = {
        target: {
          value: '12345678',
        },
      };
      const confirmPasswordEvent = {
        target: {
          value: '123456789',
        },
      };

      fireEvent.change(createPasswordInput as HTMLElement, createPasswordEvent);
      fireEvent.change(
        confirmPasswordInput as HTMLElement,
        confirmPasswordEvent,
      );

      const passwordMismatchError = queryByText(
        messages.passwordsDontMatch.message,
      );

      expect(passwordMismatchError).toBeInTheDocument();

      const createNewWalletButton = queryByTestId('create-password-submit');

      expect(createNewWalletButton).toBeDisabled();

      fireEvent.click(createNewWalletButton as HTMLElement);

      expect(mockCreateNewAccount).not.toHaveBeenCalled();
    });

    it('should not create new wallet without terms checked when its social login flow', () => {
      const mockStore = configureMockStore([thunk])(mockState);
      const { queryByTestId } = renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        mockStore,
      );

      const createPasswordInput = queryByTestId('create-password-new-input');
      const confirmPasswordInput = queryByTestId(
        'create-password-confirm-input',
      );

      const createPasswordEvent = {
        target: {
          value: '12345678',
        },
      };
      const confirmPasswordEvent = {
        target: {
          value: '12345678',
        },
      };

      fireEvent.change(createPasswordInput as HTMLElement, createPasswordEvent);
      fireEvent.change(
        confirmPasswordInput as HTMLElement,
        confirmPasswordEvent,
      );

      const terms = queryByTestId('create-password-terms');

      expect(terms).not.toBeChecked();

      const createNewWalletButton = queryByTestId('create-password-submit');

      expect(createNewWalletButton).toBeDisabled();

      fireEvent.click(createNewWalletButton as HTMLElement);

      expect(mockCreateNewAccount).not.toHaveBeenCalled();
    });

    it('should create new wallet without marketing checked when its social login flow', async () => {
      const mockStore = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          firstTimeFlowType: FirstTimeFlowType.socialCreate,
        },
      });
      const { queryByTestId } = renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        mockStore,
      );

      const createPasswordInput = queryByTestId('create-password-new-input');
      const confirmPasswordInput = queryByTestId(
        'create-password-confirm-input',
      );

      const createPasswordEvent = {
        target: {
          value: '12345678',
        },
      };
      const confirmPasswordEvent = {
        target: {
          value: '12345678',
        },
      };

      fireEvent.change(createPasswordInput as HTMLElement, createPasswordEvent);
      fireEvent.change(
        confirmPasswordInput as HTMLElement,
        confirmPasswordEvent,
      );

      const terms = queryByTestId('create-password-terms');

      expect(terms).not.toBeChecked();

      const createNewWalletButton = queryByTestId('create-password-submit');

      expect(createNewWalletButton).toBeEnabled();

      fireEvent.click(createNewWalletButton as HTMLElement);

      await waitFor(() => {
        expect(mockCreateNewAccount).toHaveBeenCalled();
      });
    });
  });

  describe('Create New Account', () => {
    it('should create new account with correct passwords and terms checked', async () => {
      const mockStore = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          firstTimeFlowType: FirstTimeFlowType.create,
        },
      });
      const { queryByTestId } = renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        mockStore,
      );

      const createPasswordInput = queryByTestId('create-password-new-input');
      const confirmPasswordInput = queryByTestId(
        'create-password-confirm-input',
      );

      const password = '12345678';

      const createPasswordEvent = {
        target: {
          value: password,
        },
      };
      const confirmPasswordEvent = {
        target: {
          value: password,
        },
      };

      fireEvent.change(createPasswordInput as HTMLElement, createPasswordEvent);
      fireEvent.change(
        confirmPasswordInput as HTMLElement,
        confirmPasswordEvent,
      );

      const terms = queryByTestId('create-password-terms');
      fireEvent.click(terms as HTMLElement);

      const createNewWalletButton = queryByTestId('create-password-submit');

      expect(createNewWalletButton).not.toBeDisabled();

      fireEvent.click(createNewWalletButton as HTMLElement);

      expect(mockCreateNewAccount).toHaveBeenCalled();

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(
          ONBOARDING_SETUP_PASSKEY_ROUTE,
          {
            replace: true,
          },
        );
      });
    });

    it('tracks Wallet Creation Attempted when creating a new wallet password', async () => {
      // Historically this Segment event was named "Wallet Password Created".
      const mockStore = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          firstTimeFlowType: FirstTimeFlowType.create,
        },
      });
      const { queryByTestId } = renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        mockStore,
      );

      const password = '12345678';
      fireEvent.change(
        queryByTestId('create-password-new-input') as HTMLElement,
        {
          target: { value: password },
        },
      );
      fireEvent.change(
        queryByTestId('create-password-confirm-input') as HTMLElement,
        {
          target: { value: password },
        },
      );
      fireEvent.click(queryByTestId('create-password-terms') as HTMLElement);
      fireEvent.click(queryByTestId('create-password-submit') as HTMLElement);

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            name: MetaMetricsEventName.WalletCreationAttempted,
            properties: expect.objectContaining({
              category: MetaMetricsEventCategory.Onboarding,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              account_type: 'metamask',
            }),
          }),
        );
      });
    });

    it('navigates to review SRP when passkey feature is unavailable after wallet creation', async () => {
      jest.mocked(getIsPasskeyFeatureEnabled).mockReturnValueOnce(false);
      const mockStore = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          firstTimeFlowType: FirstTimeFlowType.create,
        },
      });
      const { queryByTestId } = renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        mockStore,
      );

      const password = '12345678';
      fireEvent.change(
        queryByTestId('create-password-new-input') as HTMLElement,
        {
          target: { value: password },
        },
      );
      fireEvent.change(
        queryByTestId('create-password-confirm-input') as HTMLElement,
        {
          target: { value: password },
        },
      );
      fireEvent.click(queryByTestId('create-password-terms') as HTMLElement);
      fireEvent.click(queryByTestId('create-password-submit') as HTMLElement);

      expect(mockCreateNewAccount).toHaveBeenCalled();

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(
          ONBOARDING_REVIEW_SRP_ROUTE,
          {
            replace: true,
          },
        );
      });
    });

    it('includes deferred deep link UTM params in the wallet setup completed event for new wallets', async () => {
      const mockStore = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          firstTimeFlowType: FirstTimeFlowType.create,
          deferredDeepLink: {
            createdAt: 1765465337256,
            referringLink:
              'https://link.metamask.io/swap?utm_source=newsletter&utm_campaign=spring-sale&utm_medium=email&foo=bar',
          },
        },
      });
      const { queryByTestId } = renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        mockStore,
      );

      const password = '12345678';
      fireEvent.change(
        queryByTestId('create-password-new-input') as HTMLElement,
        {
          target: { value: password },
        },
      );
      fireEvent.change(
        queryByTestId('create-password-confirm-input') as HTMLElement,
        {
          target: { value: password },
        },
      );
      fireEvent.click(queryByTestId('create-password-terms') as HTMLElement);
      fireEvent.click(queryByTestId('create-password-submit') as HTMLElement);

      await waitFor(() => {
        expect(getWalletSetupCompletedEvent()).toBeDefined();
      });

      const walletSetupCompletedEvent = getWalletSetupCompletedEvent();

      expect(walletSetupCompletedEvent).toMatchObject({
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          utm_source: 'newsletter',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          utm_campaign: 'spring-sale',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          utm_medium: 'email',
        },
      });
      expect(walletSetupCompletedEvent.properties).not.toHaveProperty('foo');
    });
  });

  describe('Import Wallet', () => {
    const importMockState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        firstTimeFlowType: FirstTimeFlowType.import,
      },
    };

    it('should import wallet', async () => {
      const mockStore = configureMockStore([thunk])(importMockState);

      const props = {
        importWithRecoveryPhrase: jest.fn().mockResolvedValue('password'),
        secretRecoveryPhrase: 'SRP',
        createNewAccount: jest.fn().mockResolvedValue(''),
      };

      const { queryByTestId } = renderWithProvider(
        <CreatePassword {...props} />,
        mockStore,
      );

      const createPasswordInput = queryByTestId('create-password-new-input');
      const confirmPasswordInput = queryByTestId(
        'create-password-confirm-input',
      );

      const password = '12345678';

      const createPasswordEvent = {
        target: {
          value: password,
        },
      };
      const confirmPasswordEvent = {
        target: {
          value: password,
        },
      };

      fireEvent.change(createPasswordInput as HTMLElement, createPasswordEvent);
      fireEvent.change(
        confirmPasswordInput as HTMLElement,
        confirmPasswordEvent,
      );

      const terms = queryByTestId('create-password-terms');
      fireEvent.click(terms as HTMLElement);

      const importWalletButton = queryByTestId('create-password-submit');
      fireEvent.click(importWalletButton as HTMLElement);

      expect(props.importWithRecoveryPhrase).toHaveBeenCalledWith(
        password,
        props.secretRecoveryPhrase,
      );

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(
          ONBOARDING_SETUP_PASSKEY_ROUTE,
          {
            replace: true,
          },
        );
      });
    });

    it('navigates to MetaMetrics after import when passkey feature is unavailable', async () => {
      jest.mocked(getIsPasskeyFeatureEnabled).mockReturnValueOnce(false);
      const mockStore = configureMockStore([thunk])(importMockState);

      const props = {
        importWithRecoveryPhrase: jest.fn().mockResolvedValue(undefined),
        secretRecoveryPhrase: 'SRP',
        createNewAccount: jest.fn().mockResolvedValue(''),
      };

      const { queryByTestId } = renderWithProvider(
        <CreatePassword {...props} />,
        mockStore,
      );

      const password = '12345678';
      fireEvent.change(
        queryByTestId('create-password-new-input') as HTMLElement,
        {
          target: { value: password },
        },
      );
      fireEvent.change(
        queryByTestId('create-password-confirm-input') as HTMLElement,
        {
          target: { value: password },
        },
      );
      fireEvent.click(queryByTestId('create-password-terms') as HTMLElement);
      fireEvent.click(queryByTestId('create-password-submit') as HTMLElement);

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_METAMETRICS, {
          replace: true,
        });
      });
    });

    it('includes deferred deep link UTM params in the wallet setup completed event for imported wallets', async () => {
      const mockStore = configureMockStore([thunk])({
        ...importMockState,
        metamask: {
          ...importMockState.metamask,
          deferredDeepLink: {
            createdAt: 1765465337256,
            referringLink:
              'https://link.metamask.io/swap?utm_source=partner&utm_content=hero-banner&utm_term=wallet&foo=bar',
          },
        },
      });

      const props = {
        importWithRecoveryPhrase: jest.fn().mockResolvedValue(undefined),
        secretRecoveryPhrase: 'SRP',
        createNewAccount: jest.fn().mockResolvedValue(''),
      };

      const { queryByTestId } = renderWithProvider(
        <CreatePassword {...props} />,
        mockStore,
      );

      const password = '12345678';
      fireEvent.change(
        queryByTestId('create-password-new-input') as HTMLElement,
        {
          target: { value: password },
        },
      );
      fireEvent.change(
        queryByTestId('create-password-confirm-input') as HTMLElement,
        {
          target: { value: password },
        },
      );
      fireEvent.click(queryByTestId('create-password-terms') as HTMLElement);
      fireEvent.click(queryByTestId('create-password-submit') as HTMLElement);

      await waitFor(() => {
        expect(getWalletSetupCompletedEvent()).toBeDefined();
      });

      const walletSetupCompletedEvent = getWalletSetupCompletedEvent();

      expect(walletSetupCompletedEvent).toMatchObject({
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          utm_source: 'partner',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          utm_content: 'hero-banner',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          utm_term: 'wallet',
        },
      });
      expect(walletSetupCompletedEvent.properties).not.toHaveProperty('foo');
    });
  });

  describe('Analytics IFrame', () => {
    it('should inject iframe when participating in metametrics', () => {
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          completedMetaMetricsOnboarding: true,
          optedIn: true,
        },
      };
      const mockStore = configureMockStore([thunk])(state);
      const { queryByTestId } = renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        mockStore,
      );
      expect(queryByTestId('create-password-iframe')).toBeInTheDocument();
    });

    it('should not inject iframe when participating in metametrics', () => {
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          completedMetaMetricsOnboarding: true,
          optedIn: false,
        },
      };
      const mockStore = configureMockStore()(state);
      const { queryByTestId } = renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        mockStore,
      );
      expect(queryByTestId('create-password-iframe')).not.toBeInTheDocument();
    });
  });

  describe('Uncovered routing branches', () => {
    it('routes to completion when keyring present and flow is socialImport (non-Firefox, no passkey)', () => {
      jest.mocked(getIsPasskeyFeatureEnabled).mockReturnValueOnce(false);
      const store = configureMockStore([thunk])({
        ...initializedMockState,
        metamask: {
          ...initializedMockState.metamask,
          firstTimeFlowType: FirstTimeFlowType.socialImport,
        },
      });
      renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        store,
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_COMPLETION_ROUTE,
        { replace: true },
      );
    });

    it('routes to completion when keyring present and flow is socialCreate', () => {
      const store = configureMockStore([thunk])({
        ...initializedMockState,
        metamask: {
          ...initializedMockState.metamask,
          firstTimeFlowType: FirstTimeFlowType.socialCreate,
        },
      });
      renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        store,
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_COMPLETION_ROUTE,
        { replace: true },
      );
    });

    it('routes to import-with-srp when flow is import and no secretRecoveryPhrase', () => {
      const store = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          firstTimeFlowType: FirstTimeFlowType.import,
        },
      });
      renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase=""
        />,
        store,
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_IMPORT_WITH_SRP_ROUTE,
        { replace: true },
      );
    });
  });

  describe('Back button', () => {
    it('routes to import-with-srp when back is clicked in import flow', async () => {
      const store = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          firstTimeFlowType: FirstTimeFlowType.import,
        },
      });
      const { getByTestId } = renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        store,
      );

      fireEvent.click(getByTestId('create-password-back-button'));

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(
          ONBOARDING_IMPORT_WITH_SRP_ROUTE,
          { replace: true },
        );
      });
    });

    it('resets onboarding and navigates to welcome when back is clicked in non-import flow', async () => {
      const resetOnboardingSpy = jest
        .spyOn(Actions, 'resetOnboarding')
        .mockReturnValue(jest.fn().mockResolvedValue(null));
      jest
        .spyOn(Actions, 'forceUpdateMetamaskState')
        .mockResolvedValue(undefined);

      const store = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          firstTimeFlowType: FirstTimeFlowType.create,
        },
      });
      const { getByTestId } = renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase=""
        />,
        store,
      );

      fireEvent.click(getByTestId('create-password-back-button'));

      await waitFor(() => {
        expect(resetOnboardingSpy).toHaveBeenCalled();
        expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_WELCOME_ROUTE, {
          replace: true,
        });
      });
    });
  });

  describe('handleWalletImport Firefox / social login path', () => {
    it('routes to completion after import when running on Firefox', async () => {
      jest.mocked(getIsPasskeyFeatureEnabled).mockReturnValueOnce(false);
      jest.mocked(useIsFirefox).mockReturnValue(true);

      const store = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          firstTimeFlowType: FirstTimeFlowType.import,
        },
      });
      const { queryByTestId } = renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={jest.fn().mockResolvedValue(undefined)}
          secretRecoveryPhrase="SRP"
        />,
        store,
      );

      const password = '12345678';
      fireEvent.change(
        queryByTestId('create-password-new-input') as HTMLElement,
        { target: { value: password } },
      );
      fireEvent.change(
        queryByTestId('create-password-confirm-input') as HTMLElement,
        { target: { value: password } },
      );
      fireEvent.click(queryByTestId('create-password-terms') as HTMLElement);
      fireEvent.click(queryByTestId('create-password-submit') as HTMLElement);

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(
          ONBOARDING_COMPLETION_ROUTE,
          { replace: true },
        );
      });
    });
  });

  describe('handleCreateNewWallet social login path', () => {
    const socialLoginState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        firstTimeFlowType: FirstTimeFlowType.socialCreate,
        isSeedlessOnboardingUserAuthenticated: true,
        authConnection: 'google',
        socialLoginEmail: 'user@example.com',
      },
    };

    it('routes to download-app route after wallet creation in social login flow', async () => {
      jest.mocked(getIsPasskeyFeatureEnabled).mockReturnValueOnce(false);
      const store = configureMockStore([thunk])(socialLoginState);
      const { queryByTestId } = renderWithProvider(
        <CreatePassword
          createNewAccount={mockCreateNewAccount}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        store,
      );

      const password = '12345678';
      fireEvent.change(
        queryByTestId('create-password-new-input') as HTMLElement,
        { target: { value: password } },
      );
      fireEvent.change(
        queryByTestId('create-password-confirm-input') as HTMLElement,
        { target: { value: password } },
      );
      fireEvent.click(queryByTestId('create-password-submit') as HTMLElement);

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(
          ONBOARDING_DOWNLOAD_APP_ROUTE,
          { replace: true },
        );
      });
    });
  });

  describe('handleCreatePassword error path', () => {
    it('tracks WalletSetupFailure event when wallet creation throws', async () => {
      const store = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          firstTimeFlowType: FirstTimeFlowType.create,
        },
      });
      const { queryByTestId } = renderWithProvider(
        <CreatePassword
          createNewAccount={jest.fn().mockRejectedValue(new Error('fail'))}
          importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
          secretRecoveryPhrase="SRP"
        />,
        store,
      );

      const password = '12345678';
      fireEvent.change(
        queryByTestId('create-password-new-input') as HTMLElement,
        { target: { value: password } },
      );
      fireEvent.change(
        queryByTestId('create-password-confirm-input') as HTMLElement,
        { target: { value: password } },
      );
      fireEvent.click(queryByTestId('create-password-terms') as HTMLElement);
      fireEvent.click(queryByTestId('create-password-submit') as HTMLElement);

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            name: MetaMetricsEventName.WalletSetupFailure,
          }),
        );
      });
    });
  });

  it('should redirect to onboarding welcome page when seedless onboarding user is not authenticated', async () => {
    const mockGetIsSeedlessOnboardingUserAuthenticated = jest
      .spyOn(Actions, 'getIsSeedlessOnboardingUserAuthenticated')
      .mockReturnValueOnce(jest.fn().mockResolvedValue(false));
    const mockStore = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        firstTimeFlowType: FirstTimeFlowType.socialCreate,
      },
    });
    renderWithProvider(
      <CreatePassword
        createNewAccount={mockCreateNewAccount}
        importWithRecoveryPhrase={mockImportWithRecoveryPhrase}
        secretRecoveryPhrase="SRP"
      />,
      mockStore,
    );

    await waitFor(() => {
      expect(mockGetIsSeedlessOnboardingUserAuthenticated).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_WELCOME_ROUTE, {
        replace: true,
      });
    });
  });
});
