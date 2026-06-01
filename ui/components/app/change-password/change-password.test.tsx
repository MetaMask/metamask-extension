import React from 'react';
import configureMockStore from 'redux-mock-store';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { ExtensionPasskeyErrorCode } from '../../../../shared/lib/passkey/passkey-error';
import {
  startPasskeyAuthentication,
  cancelPasskeyCeremony,
} from '../../../../shared/lib/passkey';
import { toast } from '../../ui/toast/toast';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../shared/constants/app';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { tEn } from '../../../../test/lib/i18n-helpers';
import mockState from '../../../../test/data/mock-state.json';
import {
  SECURITY_ROUTE,
  SECURITY_PASSWORD_CHANGE_V2_ROUTE,
} from '../../../helpers/constants/routes';
import * as selectors from '../../../selectors';
import ChangePassword from './change-password';

const PASSKEY_LABEL_BIOMETRICS = tEn('passkeyAuthMethodBiometrics');

jest.mock('../../ui/toast/toast', () => {
  const actual = jest.requireActual<typeof import('../../ui/toast/toast')>(
    '../../ui/toast/toast',
  );
  return {
    ...actual,
    toast: {
      ...actual.toast,
      error: jest.fn(),
      success: jest.fn(),
    },
    ToastContent: actual.ToastContent,
  };
});

jest.mock('../../../../shared/lib/environment-type', () => ({
  ...jest.requireActual<
    typeof import('../../../../shared/lib/environment-type')
  >('../../../../shared/lib/environment-type'),
  getEnvironmentType: jest.fn(),
}));

jest.mock('../../../../shared/lib/sentry', () => ({
  ...jest.requireActual<typeof import('../../../../shared/lib/sentry')>(
    '../../../../shared/lib/sentry',
  ),
  captureException: jest.fn(),
}));

const mockUseNavigate = jest.fn();
const mockChangePassword = jest
  .fn()
  .mockImplementation((_newPwd: string, _currentPwd: string) => {
    return Promise.resolve();
  });
const mockVerifyPassword = jest.fn().mockImplementation((_pwd: string) => {
  return Promise.resolve();
});
const mockGeneratePasskeyAuthenticationOptions = jest.fn(() =>
  Promise.resolve({}),
);
const mockChangePasswordWithPasskeyVerification = jest.fn(
  (
    _newPassword: string,
    _authenticationResponse: unknown,
    _options?: unknown,
  ) => Promise.resolve(),
);
const mockForceUpdateMetamaskState = jest.fn(() => Promise.resolve());
const mockRemovePasskeyWithPasswordVerification = jest.fn((_password: string) =>
  Promise.resolve(),
);

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    /**
     * Thunk middleware is not wired in these tests; mocked action creators often
     * return a Promise directly. Forward it so `await dispatch(promise)` rejects
     * into the component `catch` like production.
     */
    useDispatch: () =>
      jest.fn((action: unknown) => {
        if (
          action !== null &&
          typeof action === 'object' &&
          'then' in action &&
          typeof (action as { then: unknown }).then === 'function'
        ) {
          return action;
        }
        return undefined;
      }),
  };
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  changePassword: (_newPwd: string, _currentPwd: string) => {
    return mockChangePassword(_newPwd, _currentPwd);
  },
  verifyPassword: (_pwd: string) => {
    return mockVerifyPassword(_pwd);
  },
  generatePasskeyAuthenticationOptions: () =>
    mockGeneratePasskeyAuthenticationOptions(),
  changePasswordWithPasskeyVerification: (
    newPassword: string,
    authenticationResponse: unknown,
    options: { renewVaultKeyProtection: boolean },
  ) =>
    mockChangePasswordWithPasskeyVerification(
      newPassword,
      authenticationResponse,
      options,
    ),
  forceUpdateMetamaskState: async () => mockForceUpdateMetamaskState(),
  removePasskeyWithPasswordVerification: (password: string) =>
    mockRemovePasskeyWithPasswordVerification(password),
}));

jest.mock('../../../../shared/lib/passkey', () => ({
  ...jest.requireActual('../../../../shared/lib/passkey'),
  startPasskeyAuthentication: jest.fn(),
  cancelPasskeyCeremony: jest.fn(),
}));

jest.mock('../../../selectors', () => ({
  ...jest.requireActual('../../../selectors'),
  getIsSocialLoginFlow: jest.fn().mockReturnValue(false),
  getIsPasskeyRegistered: jest.fn().mockReturnValue(false),
  getIsPasskeyFeatureAvailable: jest.fn().mockReturnValue(false),
  getIsEnrolledPasskeyIncompatibleWithSidepanel: jest
    .fn()
    .mockReturnValue(false),
}));

describe('ChangePassword', () => {
  const mockStore = configureMockStore()(mockState);
  const mockPassword = '12345678';
  const mockNewPassword = '87654321';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getEnvironmentType).mockReturnValue('popup');
    (selectors.getIsSocialLoginFlow as jest.Mock).mockReturnValue(false);
    (selectors.getIsPasskeyRegistered as jest.Mock).mockReturnValue(false);
    (selectors.getIsPasskeyFeatureAvailable as jest.Mock).mockReturnValue(
      false,
    );
    (
      selectors.getIsEnrolledPasskeyIncompatibleWithSidepanel as jest.Mock
    ).mockReturnValue(false);
    (startPasskeyAuthentication as jest.Mock).mockResolvedValue({
      id: 'mock-credential',
    });
    mockGeneratePasskeyAuthenticationOptions.mockResolvedValue({});
  });

  async function advanceToChangePasswordStep(
    getByTestId: (id: string) => HTMLElement,
  ) {
    fireEvent.change(getByTestId('verify-current-password-input'), {
      target: { value: mockPassword },
    });
    fireEvent.click(getByTestId('verify-current-password-button'));
    await waitFor(() => {
      expect(mockVerifyPassword).toHaveBeenCalledWith(mockPassword);
    });
  }

  async function fillNewPasswordForm(getByTestId: (id: string) => HTMLElement) {
    fireEvent.change(getByTestId('change-password-input'), {
      target: { value: mockNewPassword },
    });
    fireEvent.change(getByTestId('change-password-confirm-input'), {
      target: { value: mockNewPassword },
    });
    fireEvent.click(getByTestId('change-password-terms'));

    await waitFor(() => {
      expect(getByTestId('change-password-button')).toBeEnabled();
    });
  }

  describe('Step 1: verify current password', () => {
    it('renders the current password input', () => {
      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      const input = getByTestId('verify-current-password-input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'password');
    });

    it('disables the continue button when the password field is empty', () => {
      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      expect(getByTestId('verify-current-password-button')).toBeDisabled();
    });

    it('shows an error when an incorrect password is submitted', async () => {
      mockVerifyPassword.mockRejectedValueOnce(new Error('Incorrect password'));
      const { getByTestId, getByText } = renderWithProvider(
        <ChangePassword />,
        mockStore,
      );

      fireEvent.change(getByTestId('verify-current-password-input'), {
        target: { value: 'wrongpassword' },
      });
      fireEvent.click(getByTestId('verify-current-password-button'));

      await waitFor(() => {
        expect(
          getByText(tEn('unlockPageIncorrectPassword')),
        ).toBeInTheDocument();
      });
    });

    it('advances to the change password step on successful password verification', async () => {
      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      await advanceToChangePasswordStep(getByTestId);

      expect(getByTestId('change-password-input')).toBeInTheDocument();
      expect(getByTestId('change-password-confirm-input')).toBeInTheDocument();
      expect(getByTestId('change-password-button')).toBeInTheDocument();
    });
  });

  describe('Passkey feature without enrollment', () => {
    beforeEach(() => {
      (selectors.getIsPasskeyRegistered as jest.Mock).mockReturnValue(false);
      (selectors.getIsPasskeyFeatureAvailable as jest.Mock).mockReturnValue(
        true,
      );
    });

    it('does not show the passkey unlock toggle on change password', async () => {
      const { getByTestId, queryByTestId } = renderWithProvider(
        <ChangePassword />,
        mockStore,
      );

      await advanceToChangePasswordStep(getByTestId);

      expect(
        queryByTestId('change-password-enable-passkey'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Step 2: set new password (standard flow)', () => {
    it('disables the save button until new password, confirm password, and terms are all provided', async () => {
      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      await advanceToChangePasswordStep(getByTestId);

      const saveButton = getByTestId('change-password-button');
      expect(saveButton).toBeDisabled();

      fireEvent.change(getByTestId('change-password-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.change(getByTestId('change-password-confirm-input'), {
        target: { value: mockNewPassword },
      });
      expect(saveButton).toBeDisabled();

      fireEvent.click(getByTestId('change-password-terms'));
      await waitFor(() => {
        expect(saveButton).toBeEnabled();
      });
    });

    it('changes the password and navigates to security settings on save', async () => {
      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      await advanceToChangePasswordStep(getByTestId);

      await fillNewPasswordForm(getByTestId);
      fireEvent.click(getByTestId('change-password-button'));

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith(
          mockNewPassword,
          mockPassword,
        );
        expect(mockUseNavigate).toHaveBeenCalledWith(SECURITY_ROUTE);
      });
    });
  });

  describe('Step 2: set new password (social login flow)', () => {
    beforeEach(() => {
      (selectors.getIsSocialLoginFlow as jest.Mock).mockReturnValue(true);
    });

    it('shows the warning modal on form submission instead of immediately changing the password', async () => {
      const { getByTestId, queryByTestId } = renderWithProvider(
        <ChangePassword />,
        mockStore,
      );

      await advanceToChangePasswordStep(getByTestId);

      await fillNewPasswordForm(getByTestId);
      fireEvent.click(getByTestId('change-password-button'));

      await waitFor(() => {
        expect(
          queryByTestId('change-password-warning-modal'),
        ).toBeInTheDocument();
      });
      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('canceling the warning modal returns to the change password form', async () => {
      const { getByTestId, queryByTestId } = renderWithProvider(
        <ChangePassword />,
        mockStore,
      );

      await advanceToChangePasswordStep(getByTestId);

      await fillNewPasswordForm(getByTestId);
      fireEvent.click(getByTestId('change-password-button'));

      await waitFor(() => {
        expect(
          queryByTestId('change-password-warning-modal'),
        ).toBeInTheDocument();
      });

      fireEvent.click(getByTestId('change-password-warning-cancel'));

      await waitFor(() => {
        expect(
          queryByTestId('change-password-warning-modal'),
        ).not.toBeInTheDocument();
      });
      expect(getByTestId('change-password-button')).toBeInTheDocument();
      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('confirming the warning modal proceeds with the password change', async () => {
      const { getByTestId, queryByTestId } = renderWithProvider(
        <ChangePassword />,
        mockStore,
      );

      await advanceToChangePasswordStep(getByTestId);

      await fillNewPasswordForm(getByTestId);
      fireEvent.click(getByTestId('change-password-button'));

      await waitFor(() => {
        expect(
          queryByTestId('change-password-warning-modal'),
        ).toBeInTheDocument();
      });

      fireEvent.click(getByTestId('change-password-warning-confirm'));

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith(
          mockNewPassword,
          mockPassword,
        );
        expect(mockUseNavigate).toHaveBeenCalledWith(SECURITY_ROUTE);
      });
    });
  });

  describe('Passkey flow', () => {
    const mockAssertion = { id: 'mock-credential' };

    beforeEach(() => {
      (selectors.getIsPasskeyRegistered as jest.Mock).mockReturnValue(true);
      (selectors.getIsPasskeyFeatureAvailable as jest.Mock).mockReturnValue(
        true,
      );
      (
        selectors.getIsEnrolledPasskeyIncompatibleWithSidepanel as jest.Mock
      ).mockReturnValue(false);
      (startPasskeyAuthentication as jest.Mock).mockResolvedValue(
        mockAssertion,
      );
    });

    it('skips the verify current password step when passkey is active', () => {
      const { queryByTestId } = renderWithProvider(
        <ChangePassword />,
        mockStore,
      );

      expect(
        queryByTestId('verify-current-password-input'),
      ).not.toBeInTheDocument();
    });

    it('advances to verify current password when choosing use password on verify passkey step', async () => {
      let resolveAuth: ((value: unknown) => void) | undefined;
      (startPasskeyAuthentication as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveAuth = resolve;
          }),
      );

      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      await waitFor(() => {
        expect(
          getByTestId('change-password-verify-passkey-use-password'),
        ).toBeInTheDocument();
      });

      fireEvent.click(
        getByTestId('change-password-verify-passkey-use-password'),
      );

      await waitFor(() => {
        expect(
          getByTestId('verify-current-password-input'),
        ).toBeInTheDocument();
      });

      resolveAuth?.({
        id: 'mock-credential',
        rawId: 'mock-credential',
        type: 'public-key',
        response: {
          clientDataJSON: 'e30',
          authenticatorData: 'AA',
          signature: 'AA',
        },
        clientExtensionResults: {},
      });
    });

    it('shows a loader and passkey verification title while passkey verification runs', () => {
      const { getByTestId, getByText } = renderWithProvider(
        <ChangePassword />,
        mockStore,
      );

      expect(
        getByTestId('change-password-passkey-verifying'),
      ).toBeInTheDocument();
      expect(
        getByText(tEn('passkeyVerifyingTitle', [PASSKEY_LABEL_BIOMETRICS])),
      ).toBeInTheDocument();
      expect(
        getByText(
          tEn('passkeyVerifyingDescription', [PASSKEY_LABEL_BIOMETRICS]),
        ),
      ).toBeInTheDocument();
    });

    it('shows new password fields after passkey authentication succeeds', async () => {
      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      await waitFor(() => {
        expect(mockGeneratePasskeyAuthenticationOptions).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(startPasskeyAuthentication).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(getByTestId('change-password-input')).toBeInTheDocument();
      });
    });

    it('shows unlock with passkey toggle when passkey assertion is cached, defaulting renewal on', async () => {
      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      await waitFor(() => {
        expect(getByTestId('change-password-input')).toBeInTheDocument();
      });

      const toggle = getByTestId('change-password-enable-passkey');
      expect(toggle).toBeInTheDocument();
      await waitFor(() => {
        expect(toggle.closest('label')).toHaveClass('toggle-button--on');
      });
    });

    it('turning renewal off does not trigger another passkey ceremony', async () => {
      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      await waitFor(() => {
        expect(getByTestId('change-password-input')).toBeInTheDocument();
      });

      const authCallsAfterVerify = (startPasskeyAuthentication as jest.Mock)
        .mock.calls.length;

      const toggle = getByTestId('change-password-enable-passkey');
      await waitFor(() => {
        expect(toggle.closest('label')).toHaveClass('toggle-button--on');
      });

      fireEvent.click(toggle);

      await waitFor(() => {
        expect(toggle.closest('label')).toHaveClass('toggle-button--off');
      });

      expect(jest.mocked(startPasskeyAuthentication).mock.calls.length).toBe(
        authCallsAfterVerify,
      );
    });

    it('turning renewal back on with a cached assertion does not trigger another passkey ceremony', async () => {
      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      await waitFor(() => {
        expect(getByTestId('change-password-input')).toBeInTheDocument();
      });

      const authCallsAfterVerify = (startPasskeyAuthentication as jest.Mock)
        .mock.calls.length;

      const toggle = getByTestId('change-password-enable-passkey');
      await waitFor(() => {
        expect(toggle.closest('label')).toHaveClass('toggle-button--on');
      });

      fireEvent.click(toggle);

      await waitFor(() => {
        expect(toggle.closest('label')).toHaveClass('toggle-button--off');
      });

      fireEvent.click(toggle);

      await waitFor(() => {
        expect(toggle.closest('label')).toHaveClass('toggle-button--on');
      });

      expect(jest.mocked(startPasskeyAuthentication).mock.calls.length).toBe(
        authCallsAfterVerify,
      );
    });

    it('shows unlock with passkey toggle after passkey failure fallback reaches new password', async () => {
      (startPasskeyAuthentication as jest.Mock).mockRejectedValueOnce(
        new Error('cancelled'),
      );

      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      await waitFor(() => {
        expect(
          getByTestId('verify-current-password-input'),
        ).toBeInTheDocument();
      });

      fireEvent.change(getByTestId('verify-current-password-input'), {
        target: { value: mockPassword },
      });
      fireEvent.click(getByTestId('verify-current-password-button'));

      await waitFor(() => {
        expect(
          getByTestId('change-password-enable-passkey'),
        ).toBeInTheDocument();
      });
    });

    it('runs passkey authentication when turning unlock with passkey on with no cached assertion', async () => {
      (startPasskeyAuthentication as jest.Mock).mockRejectedValueOnce(
        new Error('cancelled'),
      );

      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      await waitFor(() => {
        expect(
          getByTestId('verify-current-password-input'),
        ).toBeInTheDocument();
      });

      fireEvent.change(getByTestId('verify-current-password-input'), {
        target: { value: mockPassword },
      });
      fireEvent.click(getByTestId('verify-current-password-button'));

      await waitFor(() => {
        expect(
          getByTestId('change-password-enable-passkey'),
        ).toBeInTheDocument();
      });

      const authCallsBeforeToggle = (startPasskeyAuthentication as jest.Mock)
        .mock.calls.length;

      (startPasskeyAuthentication as jest.Mock).mockResolvedValue(
        mockAssertion,
      );
      fireEvent.click(getByTestId('change-password-enable-passkey'));

      await waitFor(() => {
        expect(
          jest.mocked(startPasskeyAuthentication).mock.calls.length,
        ).toBeGreaterThan(authCallsBeforeToggle);
      });
    });

    it('falls back to verify current password when passkey authentication fails', async () => {
      (startPasskeyAuthentication as jest.Mock).mockRejectedValueOnce(
        new Error('cancelled'),
      );

      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      await waitFor(() => {
        expect(
          getByTestId('verify-current-password-input'),
        ).toBeInTheDocument();
      });
    });

    it('does not show open in full tab after passkey failure outside the side panel', async () => {
      jest.mocked(getEnvironmentType).mockReturnValue('popup');
      (startPasskeyAuthentication as jest.Mock).mockRejectedValueOnce(
        new Error('cancelled'),
      );

      const { queryByTestId } = renderWithProvider(
        <ChangePassword />,
        mockStore,
      );

      await waitFor(() => {
        expect(
          queryByTestId('verify-current-password-input'),
        ).toBeInTheDocument();
      });

      expect(
        queryByTestId('change-password-passkey-fallback-open-full-screen'),
      ).not.toBeInTheDocument();
    });

    it('opens change password in browser tab when sidepanel and enrolled passkey is incompatible', async () => {
      const openExtensionInBrowser = jest.fn();
      globalThis.platform = { openExtensionInBrowser } as never;

      jest
        .mocked(getEnvironmentType)
        .mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
      (
        selectors.getIsEnrolledPasskeyIncompatibleWithSidepanel as jest.Mock
      ).mockReturnValue(true);

      const { getByTestId, queryByTestId } = renderWithProvider(
        <ChangePassword />,
        mockStore,
      );

      await waitFor(() => {
        expect(openExtensionInBrowser).toHaveBeenCalledWith(
          SECURITY_PASSWORD_CHANGE_V2_ROUTE,
        );
      });

      expect(
        queryByTestId('change-password-passkey-verifying-open-full-screen'),
      ).not.toBeInTheDocument();
      expect(getByTestId('verify-current-password-input')).toBeInTheDocument();
      expect(startPasskeyAuthentication).not.toHaveBeenCalled();

      delete (globalThis as { platform?: unknown }).platform;
    });

    it('opens passkey troubleshoot modal from side panel verify step and opens change password full screen from modal', async () => {
      jest
        .mocked(getEnvironmentType)
        .mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
      const openExtensionInBrowser = jest.fn();
      const previousPlatform = globalThis.platform;
      globalThis.platform = {
        ...previousPlatform,
        openExtensionInBrowser,
      } as unknown as typeof globalThis.platform;

      let resolveAuth: ((value: unknown) => void) | undefined;
      (startPasskeyAuthentication as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveAuth = resolve;
          }),
      );

      try {
        const { getByTestId } = renderWithProvider(
          <ChangePassword />,
          mockStore,
        );

        await waitFor(() => {
          expect(
            getByTestId('change-password-passkey-verifying-open-full-screen'),
          ).toBeInTheDocument();
        });

        await act(async () => {
          fireEvent.click(
            getByTestId('change-password-passkey-verifying-open-full-screen'),
          );
        });

        expect(getByTestId('passkey-troubleshoot-modal')).toBeInTheDocument();

        await act(async () => {
          fireEvent.click(
            getByTestId('passkey-troubleshoot-open-full-screen-button'),
          );
        });

        expect(jest.mocked(cancelPasskeyCeremony)).toHaveBeenCalled();
        expect(openExtensionInBrowser).toHaveBeenCalledWith(
          SECURITY_PASSWORD_CHANGE_V2_ROUTE,
        );

        await act(async () => {
          resolveAuth?.({
            id: 'mock-credential',
            rawId: 'mock-credential',
            type: 'public-key',
            response: {
              clientDataJSON: 'e30',
              authenticatorData: 'AA',
              signature: 'AA',
            },
            clientExtensionResults: {},
          });
        });
      } finally {
        globalThis.platform = previousPlatform;
      }
    });

    it('with renewal disabled after enabling toggle, saves via passkey verification with renewal off', async () => {
      (startPasskeyAuthentication as jest.Mock).mockRejectedValueOnce(
        new Error('cancelled'),
      );

      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      await waitFor(() => {
        expect(
          getByTestId('verify-current-password-input'),
        ).toBeInTheDocument();
      });

      fireEvent.change(getByTestId('verify-current-password-input'), {
        target: { value: mockPassword },
      });
      fireEvent.click(getByTestId('verify-current-password-button'));

      await waitFor(() => {
        expect(
          getByTestId('change-password-enable-passkey'),
        ).toBeInTheDocument();
      });

      (startPasskeyAuthentication as jest.Mock).mockResolvedValue(
        mockAssertion,
      );
      fireEvent.click(getByTestId('change-password-enable-passkey'));

      await waitFor(() => {
        expect(
          getByTestId('change-password-enable-passkey').closest('label'),
        ).toHaveClass('toggle-button--on');
      });

      fireEvent.click(getByTestId('change-password-enable-passkey'));

      await waitFor(() => {
        expect(
          getByTestId('change-password-enable-passkey').closest('label'),
        ).toHaveClass('toggle-button--off');
      });

      fireEvent.change(getByTestId('change-password-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.change(getByTestId('change-password-confirm-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.click(getByTestId('change-password-terms'));
      fireEvent.click(getByTestId('change-password-button'));

      await waitFor(() => {
        expect(mockChangePasswordWithPasskeyVerification).toHaveBeenCalledWith(
          mockNewPassword,
          mockAssertion,
          { renewVaultKeyProtection: false },
        );
        expect(mockChangePassword).not.toHaveBeenCalled();
        expect(
          mockRemovePasskeyWithPasswordVerification,
        ).not.toHaveBeenCalled();
        expect(mockForceUpdateMetamaskState).toHaveBeenCalled();
        expect(mockUseNavigate).toHaveBeenCalledWith(SECURITY_ROUTE);
      });
    });

    it('removes passkey with current password before password change on passkey failure fallback', async () => {
      (startPasskeyAuthentication as jest.Mock).mockRejectedValueOnce(
        new Error('cancelled'),
      );

      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      await waitFor(() => {
        expect(
          getByTestId('verify-current-password-input'),
        ).toBeInTheDocument();
      });

      fireEvent.change(getByTestId('verify-current-password-input'), {
        target: { value: mockPassword },
      });
      fireEvent.click(getByTestId('verify-current-password-button'));

      await waitFor(() => {
        expect(mockVerifyPassword).toHaveBeenCalledWith(mockPassword);
        expect(getByTestId('change-password-input')).toBeInTheDocument();
      });

      expect(mockRemovePasskeyWithPasswordVerification).not.toHaveBeenCalled();

      fireEvent.change(getByTestId('change-password-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.change(getByTestId('change-password-confirm-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.click(getByTestId('change-password-terms'));
      fireEvent.click(getByTestId('change-password-button'));

      await waitFor(() => {
        expect(mockRemovePasskeyWithPasswordVerification).toHaveBeenCalledWith(
          mockPassword,
        );
        expect(mockChangePassword).toHaveBeenCalledWith(
          mockNewPassword,
          mockPassword,
        );
        expect(
          mockRemovePasskeyWithPasswordVerification.mock.invocationCallOrder[0],
        ).toBeLessThan(mockChangePassword.mock.invocationCallOrder[0]);
        expect(mockForceUpdateMetamaskState).toHaveBeenCalled();
        expect(mockUseNavigate).toHaveBeenCalledWith(SECURITY_ROUTE);
      });
    });

    it('saves with passkey verification when passkey unlock stays enabled', async () => {
      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      await waitFor(() => {
        expect(getByTestId('change-password-input')).toBeInTheDocument();
      });

      fireEvent.change(getByTestId('change-password-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.change(getByTestId('change-password-confirm-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.click(getByTestId('change-password-terms'));
      fireEvent.click(getByTestId('change-password-button'));

      await waitFor(() => {
        expect(mockChangePasswordWithPasskeyVerification).toHaveBeenCalledWith(
          mockNewPassword,
          mockAssertion,
          { renewVaultKeyProtection: true },
        );
        expect(mockForceUpdateMetamaskState).toHaveBeenCalled();
        expect(mockUseNavigate).toHaveBeenCalledWith(SECURITY_ROUTE);
      });
    });

    it('uses passkey verification with renewal off when passkey unlock is toggled off after initial verification', async () => {
      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      await waitFor(() => {
        expect(getByTestId('change-password-input')).toBeInTheDocument();
      });

      const toggle = getByTestId('change-password-enable-passkey');
      await waitFor(() => {
        expect(toggle.closest('label')).toHaveClass('toggle-button--on');
      });

      fireEvent.click(toggle);

      await waitFor(() => {
        expect(toggle.closest('label')).toHaveClass('toggle-button--off');
      });

      fireEvent.change(getByTestId('change-password-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.change(getByTestId('change-password-confirm-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.click(getByTestId('change-password-terms'));
      fireEvent.click(getByTestId('change-password-button'));

      await waitFor(() => {
        expect(mockChangePasswordWithPasskeyVerification).toHaveBeenCalledWith(
          mockNewPassword,
          mockAssertion,
          { renewVaultKeyProtection: false },
        );
        expect(mockChangePassword).not.toHaveBeenCalled();
        expect(
          mockRemovePasskeyWithPasswordVerification,
        ).not.toHaveBeenCalled();
        expect(mockForceUpdateMetamaskState).toHaveBeenCalled();
        expect(mockUseNavigate).toHaveBeenCalledWith(SECURITY_ROUTE);
      });
    });

    it('shows a dedicated success toast and refreshes state when passkey vault renewal fails after password change', async () => {
      mockChangePasswordWithPasskeyVerification.mockRejectedValueOnce({
        data: {
          cause: {
            name: 'PasskeyControllerError',
            code: ExtensionPasskeyErrorCode.VaultKeyRenewalFailed,
          },
        },
      });

      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      await waitFor(() => {
        expect(getByTestId('change-password-input')).toBeInTheDocument();
      });

      fireEvent.change(getByTestId('change-password-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.change(getByTestId('change-password-confirm-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.click(getByTestId('change-password-terms'));
      fireEvent.click(getByTestId('change-password-button'));

      await waitFor(() => {
        expect(jest.mocked(toast.success)).toHaveBeenCalled();
      });

      const toastSuccess = jest.mocked(toast.success);
      const firstArg = toastSuccess.mock.calls[0][0] as {
        props: { title: string };
      };
      expect(firstArg.props.title).toBe(
        tEn('securityChangePasswordToastPasskeyRenewalFailed', [
          PASSKEY_LABEL_BIOMETRICS,
        ]),
      );
      expect(mockForceUpdateMetamaskState).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(SECURITY_ROUTE);
    });
  });
});
