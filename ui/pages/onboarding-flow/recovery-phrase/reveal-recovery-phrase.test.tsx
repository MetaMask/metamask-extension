import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  DEFAULT_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_REVIEW_SRP_ROUTE,
  MANAGE_WALLET_RECOVERY_ROUTE,
} from '../../../helpers/constants/routes';
import { getSeedPhrase } from '../../../store/actions';
import * as BrowserRuntimeUtils from '../../../../shared/lib/browser-runtime.utils';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import RevealRecoveryPhrase from './reveal-recovery-phrase';

const mockPasskeyAuthResponse = { id: 'assertion-id', type: 'public-key' };
const mockGeneratePasskeyAuthenticationOptions = jest
  .fn()
  .mockResolvedValue({ challenge: 'challenge' });
const mockGetSeedPhraseWithPasskey = jest
  .fn()
  .mockReturnValue(() => Promise.resolve('test srp'));

const mockGetIsPasskeyRegistered = jest.fn().mockReturnValue(false);
const mockGetIsPasskeyFeatureAvailable = jest.fn().mockReturnValue(false);
const mockGetIsSocialLoginFlow = jest.fn().mockReturnValue(false);
const mockGetIsEnrolledPasskeyIncompatibleWithSidepanel = jest
  .fn()
  .mockReturnValue(false);

const mockStartPasskeyAuthentication = jest
  .fn()
  .mockResolvedValue(mockPasskeyAuthResponse);
const mockCancelPasskeyCeremony = jest.fn();
const mockIsPasskeyCeremonySilentError = jest.fn().mockReturnValue(false);
const mockGetEnvironmentType = jest.fn().mockReturnValue('fullscreen');

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  getSeedPhrase: jest.fn(),
  getSeedPhraseWithPasskey: (
    authenticationResponse: unknown,
    keyringId?: string,
  ) => mockGetSeedPhraseWithPasskey(authenticationResponse, keyringId),
  generatePasskeyAuthenticationOptions: (...args: unknown[]) =>
    mockGeneratePasskeyAuthenticationOptions(...args),
}));

jest.mock('../../../selectors', () => ({
  ...jest.requireActual('../../../selectors'),
  getIsPasskeyRegistered: () => mockGetIsPasskeyRegistered(),
  getIsPasskeyFeatureAvailable: () => mockGetIsPasskeyFeatureAvailable(),
  getIsSocialLoginFlow: () => mockGetIsSocialLoginFlow(),
  getIsEnrolledPasskeyIncompatibleWithSidepanel: () =>
    mockGetIsEnrolledPasskeyIncompatibleWithSidepanel(),
}));

jest.mock('../../../../shared/lib/passkey', () => ({
  ...jest.requireActual('../../../../shared/lib/passkey'),
  startPasskeyAuthentication: (...args: unknown[]) =>
    mockStartPasskeyAuthentication(...args),
  cancelPasskeyCeremony: (...args: unknown[]) =>
    mockCancelPasskeyCeremony(...args),
  isPasskeyCeremonySilentError: (...args: unknown[]) =>
    mockIsPasskeyCeremonySilentError(...args),
}));

jest.mock('../../../../shared/lib/environment-type', () => ({
  getEnvironmentType: () => mockGetEnvironmentType(),
}));

jest.mock('../../../../shared/lib/sentry', () => ({
  ...jest.requireActual('../../../../shared/lib/sentry'),
  captureException: jest.fn(),
}));

const mockUseNavigate = jest.fn();
const mockUseLocation = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
  useLocation: () => mockUseLocation(),
}));

const mockGetSeedPhrase = getSeedPhrase as jest.Mock;

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
      selectedAccount: 'accountId',
    },
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: ['0x0000000000000000000000000000000000000000'],
      },
    ],
  },
};

describe('RevealRecoveryPhrase', () => {
  const mockSetSecretRecoveryPhrase = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({ search: '' });
  });

  it('renders the component with heading and form', () => {
    const mockStore = configureMockStore()(mockState);
    const { getByTestId, getByText } = renderWithProvider(
      <RevealRecoveryPhrase
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
      />,
      mockStore,
    );

    expect(getByTestId('reveal-recovery-phrase')).toBeInTheDocument();
    expect(
      getByText(messages.revealSecretRecoveryPhrase.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.enterPasswordContinue.message),
    ).toBeInTheDocument();
    expect(getByTestId('reveal-recovery-phrase-continue')).toBeInTheDocument();
  });

  it('redirects to metametrics page when seed phrase is already backed up', () => {
    const store = configureMockStore()({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        seedPhraseBackedUp: true,
      },
    });

    renderWithProvider(
      <RevealRecoveryPhrase
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
      />,
      store,
    );

    expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_METAMETRICS, {
      replace: true,
    });
  });

  it('redirects to completion page on Firefox when seed phrase is already backed up', () => {
    jest
      .spyOn(BrowserRuntimeUtils, 'getBrowserName')
      .mockReturnValue(PLATFORM_FIREFOX);

    const store = configureMockStore()({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        seedPhraseBackedUp: true,
      },
    });

    renderWithProvider(
      <RevealRecoveryPhrase
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
      />,
      store,
    );

    expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_COMPLETION_ROUTE, {
      replace: true,
    });
  });

  it('updates password state on input change', () => {
    const mockStore = configureMockStore()(mockState);
    const { container } = renderWithProvider(
      <RevealRecoveryPhrase
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
      />,
      mockStore,
    );

    const passwordInput = container.querySelector(
      '#account-details-authenticate',
    ) as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });

    expect(passwordInput.value).toBe('testpassword');
  });

  it('navigates to review SRP route on successful password submission', async () => {
    const mockSeedPhrase = 'test seed phrase words here';
    mockGetSeedPhrase.mockResolvedValue(mockSeedPhrase);

    const mockStore = configureMockStore()(mockState);
    const { getByTestId } = renderWithProvider(
      <RevealRecoveryPhrase
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
      />,
      mockStore,
    );

    const continueButton = getByTestId('reveal-recovery-phrase-continue');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockGetSeedPhrase).toHaveBeenCalledWith('');
      expect(mockSetSecretRecoveryPhrase).toHaveBeenCalledWith(mockSeedPhrase);
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_REVIEW_SRP_ROUTE,
        { replace: true },
      );
    });
  });

  it('shows error message on incorrect password', async () => {
    mockGetSeedPhrase.mockRejectedValue(new Error('Incorrect password'));

    const mockStore = configureMockStore()(mockState);
    const { getByTestId, container, findByText } = renderWithProvider(
      <RevealRecoveryPhrase
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
      />,
      mockStore,
    );

    const passwordInput = container.querySelector(
      '#account-details-authenticate',
    ) as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

    const continueButton = getByTestId('reveal-recovery-phrase-continue');
    fireEvent.click(continueButton);

    const errorMessage = await findByText(
      messages.unlockPageIncorrectPassword.message,
    );
    expect(errorMessage).toBeInTheDocument();
  });

  it('clears error when user types after incorrect password', async () => {
    mockGetSeedPhrase.mockRejectedValue(new Error('Incorrect password'));

    const mockStore = configureMockStore()(mockState);
    const { getByTestId, container, findByText, queryByText } =
      renderWithProvider(
        <RevealRecoveryPhrase
          setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
        />,
        mockStore,
      );

    const passwordInput = container.querySelector(
      '#account-details-authenticate',
    ) as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

    const continueButton = getByTestId('reveal-recovery-phrase-continue');
    fireEvent.click(continueButton);

    await findByText(messages.unlockPageIncorrectPassword.message);

    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });

    expect(
      queryByText(messages.unlockPageIncorrectPassword.message),
    ).not.toBeInTheDocument();
  });

  it('submits password via form submit', async () => {
    const mockSeedPhrase = 'test seed phrase';
    mockGetSeedPhrase.mockResolvedValue(mockSeedPhrase);

    const mockStore = configureMockStore()(mockState);
    const { container } = renderWithProvider(
      <RevealRecoveryPhrase
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
      />,
      mockStore,
    );

    const passwordInput = container.querySelector(
      '#account-details-authenticate',
    ) as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'correctpassword' } });

    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockGetSeedPhrase).toHaveBeenCalledWith('correctpassword');
      expect(mockSetSecretRecoveryPhrase).toHaveBeenCalledWith(mockSeedPhrase);
    });
  });

  it('passes query params to the review SRP route', async () => {
    mockUseLocation.mockReturnValue({
      search: '?isFromReminder=true',
    });

    const mockSeedPhrase = 'test seed phrase';
    mockGetSeedPhrase.mockResolvedValue(mockSeedPhrase);

    const mockStore = configureMockStore()(mockState);
    const { getByTestId, container } = renderWithProvider(
      <RevealRecoveryPhrase
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
      />,
      mockStore,
    );

    const passwordInput = container.querySelector(
      '#account-details-authenticate',
    ) as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'password' } });

    const continueButton = getByTestId('reveal-recovery-phrase-continue');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(
        `${ONBOARDING_REVIEW_SRP_ROUTE}?isFromReminder=true`,
        { replace: true },
      );
    });
  });

  it('passes both query params to the review SRP route', async () => {
    mockUseLocation.mockReturnValue({
      search: '?isFromReminder=true&isFromSettingsSecurity=true',
    });

    const mockSeedPhrase = 'test seed phrase';
    mockGetSeedPhrase.mockResolvedValue(mockSeedPhrase);

    const mockStore = configureMockStore()(mockState);
    const { getByTestId, container } = renderWithProvider(
      <RevealRecoveryPhrase
        setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
      />,
      mockStore,
    );

    const passwordInput = container.querySelector(
      '#account-details-authenticate',
    ) as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'password' } });

    const continueButton = getByTestId('reveal-recovery-phrase-continue');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(
        `${ONBOARDING_REVIEW_SRP_ROUTE}?isFromReminder=true&isFromSettingsSecurity=true`,
        { replace: true },
      );
    });
  });

  describe('passkey reveal', () => {
    const mockStoreWithThunk = configureMockStore([thunk])(mockState);

    beforeEach(() => {
      mockGetIsPasskeyRegistered.mockReturnValue(true);
      mockGetIsPasskeyFeatureAvailable.mockReturnValue(true);
      mockGetIsSocialLoginFlow.mockReturnValue(false);
      mockGetIsEnrolledPasskeyIncompatibleWithSidepanel.mockReturnValue(false);
      mockStartPasskeyAuthentication.mockResolvedValue(mockPasskeyAuthResponse);
      mockIsPasskeyCeremonySilentError.mockReturnValue(false);
      mockGetEnvironmentType.mockReturnValue('fullscreen');
      mockGetSeedPhraseWithPasskey.mockReturnValue(() =>
        Promise.resolve('test srp'),
      );
    });

    afterEach(() => {
      mockGetIsPasskeyRegistered.mockReturnValue(false);
      mockGetIsPasskeyFeatureAvailable.mockReturnValue(false);
      mockGetIsSocialLoginFlow.mockReturnValue(false);
      mockGetIsEnrolledPasskeyIncompatibleWithSidepanel.mockReturnValue(false);
      mockStartPasskeyAuthentication.mockResolvedValue(mockPasskeyAuthResponse);
      mockIsPasskeyCeremonySilentError.mockReturnValue(false);
      mockGetEnvironmentType.mockReturnValue('fullscreen');
    });

    it('verifies via passkey and reveals the SRP without a password', async () => {
      renderWithProvider(
        <RevealRecoveryPhrase
          setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
        />,
        mockStoreWithThunk,
      );

      await waitFor(() => {
        expect(mockGetSeedPhraseWithPasskey).toHaveBeenCalledWith(
          mockPasskeyAuthResponse,
          undefined,
        );
        expect(mockSetSecretRecoveryPhrase).toHaveBeenCalledWith('test srp');
        expect(mockUseNavigate).toHaveBeenCalledWith(
          ONBOARDING_REVIEW_SRP_ROUTE,
          { replace: true },
        );
      });
      expect(mockGetSeedPhrase).not.toHaveBeenCalled();
    });

    it('should not mount passkey verification while the backed-up redirect is pending', async () => {
      const store = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          seedPhraseBackedUp: true,
        },
      });

      const { queryByTestId } = renderWithProvider(
        <RevealRecoveryPhrase
          setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
        />,
        store,
      );

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_METAMETRICS, {
          replace: true,
        });
      });

      expect(
        queryByTestId('reveal-recovery-phrase-passkey-verifying'),
      ).not.toBeInTheDocument();
      expect(mockGeneratePasskeyAuthenticationOptions).not.toHaveBeenCalled();
      expect(mockStartPasskeyAuthentication).not.toHaveBeenCalled();
      expect(mockGetSeedPhraseWithPasskey).not.toHaveBeenCalled();
    });

    it('falls back to the password prompt when the passkey ceremony is cancelled', async () => {
      mockStartPasskeyAuthentication.mockRejectedValue(new Error('cancelled'));
      mockIsPasskeyCeremonySilentError.mockReturnValue(true);

      const { container } = renderWithProvider(
        <RevealRecoveryPhrase
          setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
        />,
        mockStoreWithThunk,
      );

      await waitFor(() => {
        expect(
          container.querySelector('#account-details-authenticate'),
        ).toBeInTheDocument();
      });
      expect(mockGetSeedPhraseWithPasskey).not.toHaveBeenCalled();
    });

    it('falls back to the password prompt when "Use password" is clicked', async () => {
      mockStartPasskeyAuthentication.mockReturnValue(
        new Promise(() => {
          // never resolves
        }),
      );

      const { queryByTestId, container } = renderWithProvider(
        <RevealRecoveryPhrase
          setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
        />,
        mockStoreWithThunk,
      );

      await waitFor(() => {
        expect(
          queryByTestId('reveal-recovery-phrase-verify-passkey-use-password'),
        ).toBeInTheDocument();
      });

      fireEvent.click(
        queryByTestId(
          'reveal-recovery-phrase-verify-passkey-use-password',
        ) as HTMLElement,
      );

      await waitFor(() => {
        expect(
          container.querySelector('#account-details-authenticate'),
        ).toBeInTheDocument();
      });
    });

    it('falls back to the password prompt when passkey export fails', async () => {
      mockGetSeedPhraseWithPasskey.mockReturnValue(() =>
        Promise.reject(new Error('export failed')),
      );

      const { container } = renderWithProvider(
        <RevealRecoveryPhrase
          setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
        />,
        mockStoreWithThunk,
      );

      await waitFor(() => {
        expect(
          container.querySelector('#account-details-authenticate'),
        ).toBeInTheDocument();
      });
      expect(mockSetSecretRecoveryPhrase).not.toHaveBeenCalled();
    });

    it('uses the password prompt for social-login wallets even when a passkey is enrolled', async () => {
      mockGetIsSocialLoginFlow.mockReturnValue(true);

      const { container, queryByTestId } = renderWithProvider(
        <RevealRecoveryPhrase
          setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
        />,
        mockStoreWithThunk,
      );

      expect(
        container.querySelector('#account-details-authenticate'),
      ).toBeInTheDocument();
      expect(
        queryByTestId('reveal-recovery-phrase-passkey-verifying'),
      ).not.toBeInTheDocument();
      expect(mockGetSeedPhraseWithPasskey).not.toHaveBeenCalled();
    });

    it('falls back to the password prompt in the side panel when the enrolled passkey is incompatible there', async () => {
      mockGetIsEnrolledPasskeyIncompatibleWithSidepanel.mockReturnValue(true);
      mockGetEnvironmentType.mockReturnValue('sidepanel');

      const { container, queryByTestId } = renderWithProvider(
        <RevealRecoveryPhrase
          setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
        />,
        mockStoreWithThunk,
      );

      expect(
        container.querySelector('#account-details-authenticate'),
      ).toBeInTheDocument();
      expect(
        queryByTestId('reveal-recovery-phrase-passkey-verifying'),
      ).not.toBeInTheDocument();
    });
  });

  describe('returnToPreviousPage', () => {
    it('navigates to default route when not from settings security', () => {
      const mockStore = configureMockStore()(mockState);
      const { getByTestId } = renderWithProvider(
        <RevealRecoveryPhrase
          setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
        />,
        mockStore,
      );

      const backButton = getByTestId('reveal-recovery-phrase-back-button');
      fireEvent.click(backButton);

      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
        replace: true,
      });
    });

    it('navigates to reveal SRP list route when from settings security', () => {
      mockUseLocation.mockReturnValue({
        search: '?isFromSettingsSecurity=true',
      });

      const mockStore = configureMockStore()(mockState);
      const { getByTestId } = renderWithProvider(
        <RevealRecoveryPhrase
          setSecretRecoveryPhrase={mockSetSecretRecoveryPhrase}
        />,
        mockStore,
      );

      const backButton = getByTestId('reveal-recovery-phrase-back-button');
      fireEvent.click(backButton);

      expect(mockUseNavigate).toHaveBeenCalledWith(
        MANAGE_WALLET_RECOVERY_ROUTE,
        {
          replace: true,
        },
      );
    });
  });
});
