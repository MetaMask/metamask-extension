import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import CreateNewVault from './create-new-vault';

const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('CreateNewVault', () => {
  it('renders CreateNewVault component and shows Secret Recovery Phrase text', () => {
    renderWithProvider(
      <CreateNewVault submitText="Import" onSubmit={jest.fn()} />,
      store,
    );
    expect(screen.getByText('Secret Recovery Phrase')).toBeInTheDocument();
  });

  it('renders CreateNewVault component and shows You can paste... text', () => {
    renderWithProvider(
      <CreateNewVault submitText="Import" onSubmit={jest.fn()} includeTerms />,
      store,
    );
    expect(
      screen.getByText(
        'You can paste your entire secret recovery phrase into any field',
      ),
    ).toBeInTheDocument();
  });

  it('should check terms', () => {
    const props = {
      onSubmit: jest.fn(),
      submitText: 'Submit',
      includeTerms: true,
    };

    const { queryByTestId } = renderWithProvider(
      <CreateNewVault {...props} />,
      store,
    );

    const terms = queryByTestId('create-new-vault__terms-checkbox');

    fireEvent.click(terms);

    expect(terms).toBeChecked();
  });

  it('should error with password length is less than 8', () => {
    const props = {
      onSubmit: jest.fn(),
      submitText: 'Submit',
    };

    const { queryByTestId, queryByText } = renderWithProvider(
      <CreateNewVault {...props} />,
      store,
    );

    const passwordInput = queryByTestId('create-vault-password');

    const passwordEvent = {
      target: {
        value: '1234567',
      },
    };

    fireEvent.change(passwordInput, passwordEvent);

    const passwordError = queryByText('Password not long enough');

    expect(passwordError).toBeInTheDocument();

    const submitButton = queryByTestId('create-new-vault-submit-button');

    expect(submitButton).toBeDisabled();
  });

  it('should error with password and confirm password mismatch', () => {
    const props = {
      onSubmit: jest.fn(),
      submitText: 'Submit',
    };

    const { queryByTestId, queryByText } = renderWithProvider(
      <CreateNewVault {...props} />,
      store,
    );

    const passwordInput = queryByTestId('create-vault-password');
    const confirmPasswordInput = queryByTestId('create-vault-confirm-password');

    const passwordEvent = {
      target: {
        value: '12345678',
      },
    };

    const confirmPasswordEvent = {
      target: {
        value: 'abcdefgh',
      },
    };

    fireEvent.change(passwordInput, passwordEvent);
    fireEvent.change(confirmPasswordInput, confirmPasswordEvent);

    const passwordError = queryByText(`Passwords don't match`);

    expect(passwordError).toBeInTheDocument();

    const submitButton = queryByTestId('create-new-vault-submit-button');

    expect(submitButton).toBeDisabled();
  });

  it('should valid', () => {
    const props = {
      onSubmit: jest.fn(),
      submitText: 'Submit',
    };

    const { queryByTestId } = renderWithProvider(
      <CreateNewVault {...props} />,
      store,
    );

    inputSRP(TEST_SEED, queryByTestId);

    const passwordInput = queryByTestId('create-vault-password');
    const confirmPasswordInput = queryByTestId('create-vault-confirm-password');

    const password = '12345678';

    const passwordEvent = {
      target: {
        value: password,
      },
    };

    const confirmPasswordEvent = {
      target: {
        value: password,
      },
    };

    fireEvent.change(passwordInput, passwordEvent);
    fireEvent.change(confirmPasswordInput, confirmPasswordEvent);

    const submitButton = queryByTestId('create-new-vault-submit-button');
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    expect(props.onSubmit).toHaveBeenCalledWith(password, TEST_SEED);
  });
});

function inputSRP(seedStr, queryByTestId) {
  for (const [index, word] of seedStr.split(' ').entries()) {
    const srpInput = queryByTestId(`import-srp__srp-word-${index}`);
    fireEvent.change(srpInput, { target: { value: word } });
  }
}
