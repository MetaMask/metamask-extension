import React from 'react';
import configureMockStore from 'redux-mock-store';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import {
  SECURITY_AND_PASSWORD_ROUTE,
  SECURITY_REGISTER_PASSKEY_ROUTE,
} from '../../../helpers/constants/routes';
import { SECOND } from '../../../../shared/constants/time';
import { toast } from '../../../components/ui/toast/toast';
import PasskeyRegisterSubPage from './passkey-register-sub-page';

jest.mock('../../../components/ui/toast/toast', () => ({
  toast: {
    success: jest.fn(),
  },
  ToastContent: ({ title }: { title: string }) => title,
}));

const mockUseNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockProtectVaultKeyWithPasskey = jest.fn().mockResolvedValue(undefined);
const mockGeneratePasskeyRegistrationOptions = jest.fn().mockResolvedValue({
  rp: { name: 'MetaMask' },
  user: { id: 'AQ', name: 'MetaMask User', displayName: 'MetaMask' },
  challenge: 'AQ',
  pubKeyCredParams: [
    { alg: -7, type: 'public-key' },
    { alg: -257, type: 'public-key' },
  ],
  authenticatorSelection: {
    residentKey: 'preferred',
    userVerification: 'required',
    authenticatorAttachment: 'platform',
  },
  extensions: { prf: { eval: { first: 'AQ' } } },
});
const mockGeneratePasskeyPostRegistrationAuthenticationOptions = jest
  .fn()
  .mockResolvedValue({
    challenge: 'AQ',
    allowCredentials: [],
  });
const mockForceUpdateMetamaskState = jest.fn().mockResolvedValue(undefined);

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

jest.mock('../../../../shared/lib/passkey', () => ({
  ...jest.requireActual<typeof import('../../../../shared/lib/passkey')>(
    '../../../../shared/lib/passkey',
  ),
  startPasskeyRegistration: jest.fn().mockResolvedValue({
    id: 'AQ',
    rawId: 'AQ',
    type: 'public-key',
    response: {
      clientDataJSON: 'e30',
      attestationObject: 'e30',
    },
    clientExtensionResults: {},
  }),
  startPasskeyAuthentication: jest.fn().mockResolvedValue({
    id: 'AQ',
    rawId: 'AQ',
    type: 'public-key',
    response: {
      clientDataJSON: 'e30',
      authenticatorData: 'AA',
      signature: 'AA',
    },
    clientExtensionResults: {},
  }),
}));

jest.mock('../../../../shared/lib/sentry', () => ({
  ...jest.requireActual<typeof import('../../../../shared/lib/sentry')>(
    '../../../../shared/lib/sentry',
  ),
  captureException: jest.fn(),
}));

const mockVerifyPassword = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  generatePasskeyRegistrationOptions: (...args: unknown[]) =>
    mockGeneratePasskeyRegistrationOptions(...args),
  generatePasskeyPostRegistrationAuthenticationOptions: (...args: unknown[]) =>
    mockGeneratePasskeyPostRegistrationAuthenticationOptions(...args),
  protectVaultKeyWithPasskey: (...args: unknown[]) =>
    mockProtectVaultKeyWithPasskey(...args),
  forceUpdateMetamaskState: (...args: unknown[]) =>
    mockForceUpdateMetamaskState(...args),
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
}));

const stateWithPasskeyRegistered = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
    passkeyRecord: { credentialId: 'existing-credential' },
  },
};

describe('PasskeyRegisterSubPage', () => {
  const mockStore = configureMockStore()(mockState);
  const mockToastSuccess = jest.mocked(toast.success);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to security when biometrics is already registered', async () => {
    const store = configureMockStore()(stateWithPasskeyRegistered);
    renderWithProvider(<PasskeyRegisterSubPage />, store);

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(
        SECURITY_AND_PASSWORD_ROUTE,
        { replace: true },
      );
    });
  });

  it('renders the verify-password step first', () => {
    const { getByTestId } = renderWithProvider(
      <PasskeyRegisterSubPage />,
      mockStore,
    );

    expect(getByTestId('register-passkey-password-input')).toBeInTheDocument();
    expect(
      getByTestId('register-passkey-verify-continue-button'),
    ).toBeInTheDocument();
  });

  it('renders intro before password when opened from side panel', () => {
    const { getByTestId, queryByTestId } = renderWithProvider(
      <PasskeyRegisterSubPage />,
      mockStore,
      `${SECURITY_REGISTER_PASSKEY_ROUTE}?from=sidepanel`,
    );

    expect(
      getByTestId('register-passkey-intro-description'),
    ).toBeInTheDocument();
    expect(
      getByTestId('register-passkey-intro-continue-button'),
    ).toBeInTheDocument();
    expect(
      queryByTestId('register-passkey-password-input'),
    ).not.toBeInTheDocument();
  });

  it('advances from intro to verify-password when intro continue is clicked', () => {
    const { getByTestId } = renderWithProvider(
      <PasskeyRegisterSubPage />,
      mockStore,
      `${SECURITY_REGISTER_PASSKEY_ROUTE}?from=sidepanel`,
    );

    fireEvent.click(getByTestId('register-passkey-intro-continue-button'));

    expect(getByTestId('register-passkey-password-input')).toBeInTheDocument();
    expect(
      getByTestId('register-passkey-verify-continue-button'),
    ).toBeInTheDocument();
  });

  it('starts passkey registration automatically after password verification and completes enrollment', async () => {
    const { getByTestId } = renderWithProvider(
      <PasskeyRegisterSubPage />,
      mockStore,
    );

    fireEvent.change(getByTestId('register-passkey-password-input'), {
      target: { value: 'test-password' },
    });
    fireEvent.click(getByTestId('register-passkey-verify-continue-button'));

    await waitFor(() => {
      expect(mockVerifyPassword).toHaveBeenCalledWith('test-password');
    });

    expect(getByTestId('register-passkey-description')).toBeInTheDocument();

    await waitFor(() => {
      expect(getByTestId('passkey-setup-steps')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockGeneratePasskeyRegistrationOptions).toHaveBeenCalled();
      expect(
        mockGeneratePasskeyPostRegistrationAuthenticationOptions,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'public-key',
        }),
      );
      expect(mockProtectVaultKeyWithPasskey).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'public-key',
        }),
        expect.objectContaining({
          type: 'public-key',
        }),
        'test-password',
      );
    });

    await waitFor(
      () => {
        expect(mockForceUpdateMetamaskState).toHaveBeenCalled();
        expect(mockToastSuccess).toHaveBeenCalledTimes(1);
        expect(mockToastSuccess.mock.calls[0][1]).toStrictEqual({
          duration: 5 * SECOND,
        });
        expect(mockUseNavigate).toHaveBeenCalledWith(
          SECURITY_AND_PASSWORD_ROUTE,
          {
            replace: true,
          },
        );
      },
      { timeout: 4000 },
    );
  });

  it('stays on register passkey when protectVaultKeyWithPasskey fails after ceremonies', async () => {
    mockProtectVaultKeyWithPasskey.mockRejectedValueOnce(
      new Error('vault error'),
    );

    const { getByTestId } = renderWithProvider(
      <PasskeyRegisterSubPage />,
      mockStore,
    );

    fireEvent.change(getByTestId('register-passkey-password-input'), {
      target: { value: 'test-password' },
    });
    fireEvent.click(getByTestId('register-passkey-verify-continue-button'));

    await waitFor(() => {
      expect(getByTestId('passkey-enrollment-error')).toBeInTheDocument();
    });

    expect(mockUseNavigate).not.toHaveBeenCalled();

    expect(getByTestId('register-passkey-set-up-button')).toBeInTheDocument();
  });

  it('returns to idle with retry when registration is cancelled (silent error)', async () => {
    const { startPasskeyRegistration } = jest.requireMock<
      typeof import('../../../../shared/lib/passkey')
    >('../../../../shared/lib/passkey');

    const err = new Error('not allowed');
    err.name = 'NotAllowedError';
    jest.mocked(startPasskeyRegistration).mockRejectedValueOnce(err);

    const { getByTestId, queryByTestId } = renderWithProvider(
      <PasskeyRegisterSubPage />,
      mockStore,
    );

    fireEvent.change(getByTestId('register-passkey-password-input'), {
      target: { value: 'test-password' },
    });
    fireEvent.click(getByTestId('register-passkey-verify-continue-button'));

    await waitFor(() => {
      expect(startPasskeyRegistration).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(getByTestId('register-passkey-set-up-button')).toBeInTheDocument();
    });

    expect(queryByTestId('passkey-enrollment-error')).not.toBeInTheDocument();
    expect(mockUseNavigate).not.toHaveBeenCalled();
  });

  it('retries full ceremony from the single primary button', async () => {
    const { startPasskeyRegistration } = jest.requireMock<
      typeof import('../../../../shared/lib/passkey')
    >('../../../../shared/lib/passkey');

    const err = new Error('not allowed');
    err.name = 'NotAllowedError';
    jest.mocked(startPasskeyRegistration).mockRejectedValueOnce(err);

    const { getByTestId } = renderWithProvider(
      <PasskeyRegisterSubPage />,
      mockStore,
    );

    fireEvent.change(getByTestId('register-passkey-password-input'), {
      target: { value: 'test-password' },
    });
    fireEvent.click(getByTestId('register-passkey-verify-continue-button'));

    await waitFor(() => {
      expect(getByTestId('register-passkey-set-up-button')).toBeInTheDocument();
    });

    jest.mocked(startPasskeyRegistration).mockResolvedValueOnce({
      id: 'AQ',
      rawId: 'AQ',
      type: 'public-key',
      response: {
        clientDataJSON: 'e30',
        attestationObject: 'e30',
      },
      clientExtensionResults: {},
    });

    await act(async () => {
      fireEvent.click(getByTestId('register-passkey-set-up-button'));
    });

    await waitFor(
      () => {
        expect(mockProtectVaultKeyWithPasskey).toHaveBeenCalled();
      },
      { timeout: 4000 },
    );
  });
});
