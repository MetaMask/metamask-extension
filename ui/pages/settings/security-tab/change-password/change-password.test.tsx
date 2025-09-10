import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { SECURITY_ROUTE } from '../../../../helpers/constants/routes';
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

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
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

describe('ChangePassword', () => {
  const mockStore = configureMockStore()(mockState);
  const mockPassword = '12345678';
  const mockNewPassword = '87654321';

  it('should render correctly', () => {
    const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

    const verifyCurrentPasswordInput = getByTestId(
      'verify-current-password-input',
    );

    expect(verifyCurrentPasswordInput).toBeInTheDocument();
    expect(verifyCurrentPasswordInput).toHaveAttribute('type', 'password');
  });

  it('should go to the next step when the current password verification is successful', async () => {
    const { getByTestId } = renderWithProvider(<ChangePassword />, mockStore);

    const verifyCurrentPasswordInput = getByTestId(
      'verify-current-password-input',
    );

    expect(verifyCurrentPasswordInput).toBeInTheDocument();
    expect(verifyCurrentPasswordInput).toHaveAttribute('type', 'password');

    const verifyCurrentPasswordButton = getByTestId(
      'verify-current-password-button',
    );
    expect(verifyCurrentPasswordButton).toBeInTheDocument();
    expect(verifyCurrentPasswordButton).toBeDisabled();

    fireEvent.change(verifyCurrentPasswordInput, {
      target: { value: mockPassword },
    });
    expect(verifyCurrentPasswordButton).toBeEnabled();

    fireEvent.click(verifyCurrentPasswordButton);

    await waitFor(() => {
      expect(mockVerifyPassword).toHaveBeenCalledWith(mockPassword);
    });

    const changePasswordButton = getByTestId('change-password-button');
    const changePasswordInput = getByTestId('change-password-input');
    const checkTerms = getByTestId('change-password-terms');
    const changePasswordConfirmInput = getByTestId(
      'change-password-confirm-input',
    );

    expect(changePasswordInput).toBeInTheDocument();
    expect(changePasswordConfirmInput).toBeInTheDocument();
    expect(changePasswordButton).toBeInTheDocument();
    expect(changePasswordButton).toBeDisabled();

    fireEvent.click(checkTerms);

    fireEvent.change(changePasswordInput, {
      target: { value: mockNewPassword },
    });
    fireEvent.change(changePasswordConfirmInput, {
      target: { value: mockNewPassword },
    });

    expect(changePasswordButton).toBeEnabled();

    fireEvent.click(changePasswordButton);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith(
        mockNewPassword,
        mockPassword,
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(SECURITY_ROUTE);
    });
  });
});
