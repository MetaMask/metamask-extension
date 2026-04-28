import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PasswordForm from './password-form';

const VALID_PASSWORD = 'a]2$GHvw&W';
const SHORT_PASSWORD = 'abc';

const mockT = (key: string) => key;

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => mockT,
}));

describe('PasswordForm', () => {
  let onChange: jest.Mock;

  const getPasswordInput = () =>
    screen.getByTestId('create-password-new-input');

  const getConfirmPasswordInput = () =>
    screen.getByTestId('create-password-confirm-input');

  const getShowPasswordButton = () => screen.getByTestId('show-password');

  const getShowConfirmPasswordButton = () =>
    screen.getByTestId('show-confirm-password');

  const getPasswordTextField = () =>
    getPasswordInput().closest('.mm-text-field');

  const typePassword = (value: string) => {
    fireEvent.change(getPasswordInput(), { target: { value } });
  };

  const typeConfirmPassword = (value: string) => {
    fireEvent.change(getConfirmPasswordInput(), { target: { value } });
  };

  beforeEach(() => {
    onChange = jest.fn();
  });

  describe('rendering', () => {
    beforeEach(() => {
      render(<PasswordForm onChange={onChange} />);
    });

    it('renders password and confirm password fields', () => {
      expect(getPasswordInput()).toBeInTheDocument();
      expect(getConfirmPasswordInput()).toBeInTheDocument();
    });

    it('renders labels for both fields', () => {
      expect(screen.getByText('newPasswordCreate')).toBeInTheDocument();
      expect(screen.getByText('confirmPassword')).toBeInTheDocument();
    });

    it('renders password help text', () => {
      expect(screen.getByText('passwordNotLongEnough')).toBeInTheDocument();
    });

    it('renders show/hide toggle buttons for both fields', () => {
      expect(getShowPasswordButton()).toBeInTheDocument();
      expect(getShowConfirmPasswordButton()).toBeInTheDocument();
    });

    it('uses password input type by default', () => {
      expect(getPasswordInput()).toHaveAttribute('type', 'password');
      expect(getConfirmPasswordInput()).toHaveAttribute('type', 'password');
    });
  });

  describe('custom test IDs', () => {
    it('uses custom password input test id when provided', () => {
      render(
        <PasswordForm onChange={onChange} pwdInputTestId="custom-pwd-id" />,
      );

      expect(screen.getByTestId('custom-pwd-id')).toBeInTheDocument();
    });

    it('uses custom confirm password input test id when provided', () => {
      render(
        <PasswordForm
          onChange={onChange}
          confirmPwdInputTestId="custom-confirm-id"
        />,
      );

      expect(screen.getByTestId('custom-confirm-id')).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('disables both fields when disabled prop is true', () => {
      render(<PasswordForm onChange={onChange} disabled />);

      expect(getPasswordInput()).toBeDisabled();
      expect(getConfirmPasswordInput()).toBeDisabled();
    });

    it('does not disable fields by default', () => {
      render(<PasswordForm onChange={onChange} />);

      expect(getPasswordInput()).not.toBeDisabled();
      expect(getConfirmPasswordInput()).not.toBeDisabled();
    });
  });

  describe('onChange callback', () => {
    beforeEach(() => {
      render(<PasswordForm onChange={onChange} />);
    });

    it('calls onChange with empty string on initial render', () => {
      expect(onChange).toHaveBeenCalledWith('');
    });

    it('calls onChange with password when both fields match and meet minimum length', () => {
      act(() => {
        typePassword(VALID_PASSWORD);
      });
      act(() => {
        typeConfirmPassword(VALID_PASSWORD);
      });

      expect(onChange).toHaveBeenCalledWith(VALID_PASSWORD);
    });

    it('calls onChange with empty string when passwords do not match', () => {
      act(() => {
        typePassword(VALID_PASSWORD);
      });
      act(() => {
        typeConfirmPassword('different_password');
      });

      expect(onChange).toHaveBeenLastCalledWith('');
    });

    it('calls onChange with empty string when password is too short', () => {
      act(() => {
        typePassword(SHORT_PASSWORD);
      });
      act(() => {
        typeConfirmPassword(SHORT_PASSWORD);
      });

      expect(onChange).toHaveBeenLastCalledWith('');
    });

    it('calls onChange with empty string when only password is entered', () => {
      act(() => {
        typePassword(VALID_PASSWORD);
      });

      expect(onChange).toHaveBeenLastCalledWith('');
    });

    it('calls onChange with empty string when only confirm password is entered', () => {
      act(() => {
        typeConfirmPassword(VALID_PASSWORD);
      });

      expect(onChange).toHaveBeenLastCalledWith('');
    });
  });

  describe('password length validation', () => {
    beforeEach(() => {
      render(<PasswordForm onChange={onChange} />);
    });

    it('shows length error when password is too short on blur', () => {
      act(() => {
        typePassword(SHORT_PASSWORD);
      });
      act(() => {
        fireEvent.blur(getPasswordInput());
      });

      expect(getPasswordTextField()).toHaveClass('mm-text-field--error');
    });

    it('does not show length error for empty password on blur', () => {
      act(() => {
        fireEvent.blur(getPasswordInput());
      });

      expect(getPasswordTextField()).not.toHaveClass('mm-text-field--error');
    });

    it('does not show length error when password meets minimum length', () => {
      act(() => {
        typePassword(VALID_PASSWORD);
      });
      act(() => {
        fireEvent.blur(getPasswordInput());
      });

      expect(getPasswordTextField()).not.toHaveClass('mm-text-field--error');
    });

    it('clears length error when user types after seeing the error', () => {
      act(() => {
        typePassword(SHORT_PASSWORD);
      });
      act(() => {
        fireEvent.blur(getPasswordInput());
      });

      expect(getPasswordTextField()).toHaveClass('mm-text-field--error');

      act(() => {
        typePassword(VALID_PASSWORD);
      });

      expect(getPasswordTextField()).not.toHaveClass('mm-text-field--error');
    });
  });

  describe('confirm password mismatch validation', () => {
    beforeEach(() => {
      render(<PasswordForm onChange={onChange} />);
    });

    it('shows mismatch error when passwords differ', () => {
      act(() => {
        typePassword(VALID_PASSWORD);
      });
      act(() => {
        typeConfirmPassword('mismatch_pw');
      });

      expect(screen.getByTestId('confirm-password-error')).toHaveTextContent(
        'passwordsDontMatch',
      );
    });

    it('does not show mismatch error when confirm field is empty', () => {
      act(() => {
        typePassword(VALID_PASSWORD);
      });
      act(() => {
        typeConfirmPassword('');
      });

      expect(screen.queryByText('passwordsDontMatch')).not.toBeInTheDocument();
    });

    it('clears mismatch error when passwords match', () => {
      act(() => {
        typePassword(VALID_PASSWORD);
      });
      act(() => {
        typeConfirmPassword('mismatch_pw');
      });

      expect(screen.getByText('passwordsDontMatch')).toBeInTheDocument();

      act(() => {
        typeConfirmPassword(VALID_PASSWORD);
      });

      expect(screen.queryByText('passwordsDontMatch')).not.toBeInTheDocument();
    });

    it('shows mismatch error when password field is changed to differ from confirm', () => {
      act(() => {
        typePassword(VALID_PASSWORD);
      });
      act(() => {
        typeConfirmPassword(VALID_PASSWORD);
      });

      expect(screen.queryByText('passwordsDontMatch')).not.toBeInTheDocument();

      act(() => {
        typePassword('changed_password');
      });

      expect(screen.getByText('passwordsDontMatch')).toBeInTheDocument();
    });
  });

  describe('show/hide password toggle', () => {
    beforeEach(() => {
      render(<PasswordForm onChange={onChange} />);
    });

    it('toggles password field back to password type on second toggle click', () => {
      fireEvent.click(getShowPasswordButton());
      expect(getPasswordInput()).toHaveAttribute('type', 'text');

      fireEvent.click(getShowPasswordButton());
      expect(getPasswordInput()).toHaveAttribute('type', 'password');
    });

    it('toggles confirm password field back to password type on second toggle click', () => {
      fireEvent.click(getShowConfirmPasswordButton());
      expect(getConfirmPasswordInput()).toHaveAttribute('type', 'text');

      fireEvent.click(getShowConfirmPasswordButton());
      expect(getConfirmPasswordInput()).toHaveAttribute('type', 'password');
    });

    it('toggles password and confirm password visibility independently', () => {
      fireEvent.click(getShowPasswordButton());

      expect(getPasswordInput()).toHaveAttribute('type', 'text');
      expect(getConfirmPasswordInput()).toHaveAttribute('type', 'password');

      fireEvent.click(getShowConfirmPasswordButton());

      expect(getPasswordInput()).toHaveAttribute('type', 'text');
      expect(getConfirmPasswordInput()).toHaveAttribute('type', 'text');
    });
  });

  describe('keyboard navigation', () => {
    beforeEach(() => {
      render(<PasswordForm onChange={onChange} />);
    });

    it('moves focus from password to confirm password on Enter key', () => {
      const passwordInput = getPasswordInput();
      const confirmInput = getConfirmPasswordInput();

      act(() => {
        passwordInput.focus();
      });

      fireEvent.keyDown(passwordInput, { key: 'Enter' });

      expect(confirmInput).toHaveFocus();
    });

    it('does not move focus on non-Enter key presses', () => {
      const passwordInput = getPasswordInput();

      act(() => {
        passwordInput.focus();
      });

      fireEvent.keyDown(passwordInput, { key: 'Tab' });

      expect(getConfirmPasswordInput()).not.toHaveFocus();
    });
  });

  describe('toggle button accessibility', () => {
    beforeEach(() => {
      render(<PasswordForm onChange={onChange} />);
    });

    it('has correct aria-label for show password button', () => {
      expect(getShowPasswordButton()).toHaveAttribute(
        'aria-label',
        'passwordToggleShow',
      );
    });

    it('updates aria-label when password is visible', () => {
      fireEvent.click(getShowPasswordButton());

      expect(getShowPasswordButton()).toHaveAttribute(
        'aria-label',
        'passwordToggleHide',
      );
    });

    it('has correct aria-label for show confirm password button', () => {
      expect(getShowConfirmPasswordButton()).toHaveAttribute(
        'aria-label',
        'passwordToggleShow',
      );
    });

    it('updates aria-label when confirm password is visible', () => {
      fireEvent.click(getShowConfirmPasswordButton());

      expect(getShowConfirmPasswordButton()).toHaveAttribute(
        'aria-label',
        'passwordToggleHide',
      );
    });
  });
});
