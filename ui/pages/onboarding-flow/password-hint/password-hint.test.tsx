import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import { setPasswordHint } from '../../../store/actions';
import { ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';
import PasswordHint from './password-hint';

jest.mock('../../../store/actions.ts', () => ({
  setPasswordHint: jest.fn().mockReturnValue(
    jest.fn((type) => {
      return type;
    }),
  ),
}));

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

describe('Password Hint', () => {
  const mockState = {
    metamask: {
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
    },
  };
  const mockStore = configureMockStore([thunk])(mockState);
  const password = 'password';
  const validatePasswordHint = jest.fn().mockImplementation((passwordHint) => {
    if (passwordHint === password) {
      throw new Error('Password hint is the same as the password');
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the password hint component', () => {
    const { getByText } = renderWithProvider(
      // eslint-disable-next-line no-empty-function
      <PasswordHint validatePasswordHint={() => {}} />,
      mockStore,
    );
    expect(getByText('Password hint')).toBeInTheDocument();
  });

  it('should show error when password hint is the same as the password', () => {
    const { getByTestId } = renderWithProvider(
      <PasswordHint validatePasswordHint={validatePasswordHint} />,
      mockStore,
    );
    const passwordHintTextField = getByTestId('password-hint-text-field');

    const passwordHintInput = passwordHintTextField
      .getElementsByTagName('input')
      .item(0);
    expect(passwordHintInput).toBeInTheDocument();

    if (!passwordHintInput) {
      throw new Error('Password hint input not found');
    }
    fireEvent.change(passwordHintInput, { target: { value: password } });

    const passwordHintSaveButton = getByTestId('password-hint-save');
    fireEvent.click(passwordHintSaveButton);

    expect(validatePasswordHint).toHaveBeenCalledWith(password);
    const passwordHintErrorText = getByTestId('help-text');
    expect(passwordHintErrorText).toBeInTheDocument();
    expect(passwordHintErrorText.textContent).toBe(
      'You can’t use the password as a hint',
    );
  });

  it('should save the password hint when there is no error', () => {
    const { getByTestId } = renderWithProvider(
      <PasswordHint validatePasswordHint={validatePasswordHint} />,
      mockStore,
    );
    const passwordHintTextField = getByTestId('password-hint-text-field');

    const passwordHintInput = passwordHintTextField
      .getElementsByTagName('input')
      .item(0);
    expect(passwordHintInput).toBeInTheDocument();

    if (!passwordHintInput) {
      throw new Error('Password hint input not found');
    }
    fireEvent.change(passwordHintInput, {
      target: { value: 'password-hint' },
    });

    const passwordHintSaveButton = getByTestId('password-hint-save');
    fireEvent.click(passwordHintSaveButton);

    expect(setPasswordHint).toHaveBeenCalledWith('password-hint');
    expect(mockHistoryPush).toHaveBeenCalledWith(ONBOARDING_COMPLETION_ROUTE);
  });
});
