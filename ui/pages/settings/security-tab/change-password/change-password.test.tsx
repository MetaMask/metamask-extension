import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { SECURITY_ROUTE } from '../../../../helpers/constants/routes';
import * as selectors from '../../../../selectors';
import ChangePassword from './change-password';

const mockUseNavigate = jest.fn();
const mockChangePassword = jest
  .fn()
  .mockImplementation((_newPwd: string, _currentPwd: string) => {
    return Promise.resolve();
  });
const mockVerifyPassword = jest.fn().mockImplementation((_pwd: string) => {
  return Promise.resolve();
});

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
}));

jest.mock('../../../../selectors', () => ({
  ...jest.requireActual('../../../../selectors'),
  getIsSocialLoginFlow: jest.fn().mockReturnValue(false),
}));

describe('ChangePassword', () => {
  const mockStore = configureMockStore()(mockState);
  const mockPassword = '12345678';
  const mockNewPassword = '87654321';

  beforeEach(() => {
    jest.clearAllMocks();
    (selectors.getIsSocialLoginFlow as jest.Mock).mockReturnValue(false);
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
});
