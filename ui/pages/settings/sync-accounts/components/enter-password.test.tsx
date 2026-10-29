import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithLocalization } from '../../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import { verifyPassword } from '../../../../store/actions';
import { SyncAccountsStep } from '../constant';
import EnterPassword from './enter-password';

jest.mock('../../../../store/actions', () => ({
  verifyPassword: jest.fn(),
}));

const mockVerifyPassword = jest.mocked(verifyPassword);

const getPasswordInput = () =>
  document.querySelector('input[type="password"]') as HTMLInputElement;

describe('EnterPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the heading and description', () => {
    renderWithLocalization(<EnterPassword onPasswordChange={jest.fn()} />);

    expect(
      screen.getByText(messages.enter_your_password.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.enter_your_password_desc.message),
    ).toBeInTheDocument();
  });

  it('continues to the AddWallets step when the password is correct', async () => {
    mockVerifyPassword.mockResolvedValue(true);
    const onPasswordChange = jest.fn();
    renderWithLocalization(
      <EnterPassword onPasswordChange={onPasswordChange} />,
    );

    fireEvent.change(getPasswordInput(), { target: { value: 'correct' } });
    fireEvent.click(screen.getByText(messages.continue.message));

    await waitFor(() => {
      expect(onPasswordChange).toHaveBeenCalledWith('correct');
    });
    expect(mockVerifyPassword).toHaveBeenCalledWith('correct');
  });

  it('shows an error and does not continue when the password is incorrect', async () => {
    mockVerifyPassword.mockRejectedValue(new Error('wrong password'));
    const onPasswordChange = jest.fn();
    renderWithLocalization(
      <EnterPassword onPasswordChange={onPasswordChange} />,
    );

    fireEvent.change(getPasswordInput(), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText(messages.continue.message));

    expect(
      await screen.findByText(messages.unlockPageIncorrectPassword.message),
    ).toBeInTheDocument();
    expect(onPasswordChange).not.toHaveBeenCalled();
  });
});
