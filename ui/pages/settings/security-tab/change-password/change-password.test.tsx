import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { SECURITY_ROUTE } from '../../../../helpers/constants/routes';
import * as selectors from '../../../../selectors';
import { startPasskeyAuthentication } from '../../../../../shared/lib/passkey';
import { getEnvironmentType } from '../../../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../../shared/constants/app';
import ChangePassword from './change-password';

jest.mock('../../../../../shared/lib/environment-type', () => ({
  ...jest.requireActual<
    typeof import('../../../../../shared/lib/environment-type')
  >('../../../../../shared/lib/environment-type'),
  getEnvironmentType: jest.fn(),
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
  (_newPassword: string, _authenticationResponse: unknown) => Promise.resolve(),
);
const mockForceUpdateMetamaskState = jest.fn(() => Promise.resolve());
const mockRemovePasskeyWithPasswordVerification = jest.fn(
  (_password: string) => Promise.resolve(),
);

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => jest.fn(),
  };
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
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
  ) =>
    mockChangePasswordWithPasskeyVerification(
      newPassword,
      authenticationResponse,
    ),
  forceUpdateMetamaskState: async () => mockForceUpdateMetamaskState(),
  removePasskeyWithPasswordVerification: (password: string) =>
    mockRemovePasskeyWithPasswordVerification(password),
}));

jest.mock('../../../../../shared/lib/passkey', () => ({
  ...jest.requireActual('../../../../../shared/lib/passkey'),
  startPasskeyAuthentication: jest.fn(),
  cancelPasskeyCeremony: jest.fn(),
}));

jest.mock('../../../../selectors', () => ({
  ...jest.requireActual('../../../../selectors'),
  getIsSocialLoginFlow: jest.fn().mockReturnValue(false),
  getIsPasskeyRegistered: jest.fn().mockReturnValue(false),
  getIsPasskeyFeatureAvailable: jest.fn().mockReturnValue(false),
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
          getByText(messages.unlockPageIncorrectPassword.message),
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

    it('does not show the passkey biometrics toggle on change password', async () => {
      const { getByTestId, queryByTestId } = renderWithProvider(
        <ChangePassword />,
        mockStore,
      );

      await advanceToChangePasswordStep(getByTestId);

      expect(
        queryByTestId('change-password-enable-biometrics'),
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
      expect(saveButton).toBeEnabled();
    });

    it('changes the password and navigates to security settings on save', async () => {
      const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      await advanceToChangePasswordStep(getByTestId);

      fireEvent.change(getByTestId('change-password-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.change(getByTestId('change-password-confirm-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.click(getByTestId('change-password-terms'));
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

      fireEvent.change(getByTestId('change-password-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.change(getByTestId('change-password-confirm-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.click(getByTestId('change-password-terms'));
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

      fireEvent.change(getByTestId('change-password-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.change(getByTestId('change-password-confirm-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.click(getByTestId('change-password-terms'));
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

      fireEvent.change(getByTestId('change-password-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.change(getByTestId('change-password-confirm-input'), {
        target: { value: mockNewPassword },
      });
      fireEvent.click(getByTestId('change-password-terms'));
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

      fireEvent.click(getByTestId('change-password-verify-passkey-use-password'));

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

    it('shows a loader and biometrics confirmation copy while passkey verification runs', () => {
      const { getByTestId, getByText } = renderWithProvider(
        <ChangePassword />,
        mockStore,
      );

      expect(
        getByTestId('change-password-passkey-verifying'),
      ).toBeInTheDocument();
      expect(
        getByText(messages.changePasswordPasskeyVerifyingTitle.message),
      ).toBeInTheDocument();
      expect(
        getByText(messages.changePasswordPasskeyVerifyingDescription.message),
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

      const { queryByTestId } = renderWithProvider(<ChangePassword />, mockStore);

      await waitFor(() => {
        expect(
          queryByTestId('verify-current-password-input'),
        ).toBeInTheDocument();
      });

      expect(
        queryByTestId('change-password-passkey-fallback-open-full-screen'),
      ).not.toBeInTheDocument();
    });

    it('shows open in full tab while passkey verification runs in the side panel', async () => {
      jest.mocked(getEnvironmentType).mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
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
          getByTestId('change-password-passkey-verifying-open-full-screen'),
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

      await waitFor(() => {
        expect(getByTestId('change-password-input')).toBeInTheDocument();
      });
    });

    it('removes passkey only after successful password change on passkey failure fallback', async () => {
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
        expect(mockChangePassword).toHaveBeenCalledWith(
          mockNewPassword,
          mockPassword,
        );
        expect(mockRemovePasskeyWithPasswordVerification).toHaveBeenCalledWith(
          mockNewPassword,
        );
        expect(mockForceUpdateMetamaskState).toHaveBeenCalled();
        expect(mockUseNavigate).toHaveBeenCalledWith(SECURITY_ROUTE);
      });
    });

    it('saves with passkey verification when biometrics stay enabled', async () => {
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
        );
        expect(mockForceUpdateMetamaskState).toHaveBeenCalled();
        expect(mockUseNavigate).toHaveBeenCalledWith(SECURITY_ROUTE);
      });
    });
  });
});
