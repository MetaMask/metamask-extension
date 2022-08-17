import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import {
  INITIALIZE_SEED_PHRASE_INTRO_ROUTE,
  INITIALIZE_SELECT_ACTION_ROUTE,
} from '../../../../helpers/constants/routes';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import NewAccount from '.';

describe('Name of the group', () => {
  const props = {
    onSubmit: jest.fn(),
    history: {
      push: jest.fn(),
    },
  };

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<NewAccount {...props} />);
    expect(container).toMatchSnapshot();
  });

  it('should back button', () => {
    const { queryByTestId } = renderWithProvider(<NewAccount {...props} />);
    const onboardingBackButton = queryByTestId('onboarding-back-button');

    fireEvent.click(onboardingBackButton);

    expect(props.history.push).toHaveBeenCalledWith(
      INITIALIZE_SELECT_ACTION_ROUTE,
    );
  });

  it('should initialize with a disabled create button', () => {
    const { queryByRole } = renderWithProvider(<NewAccount {...props} />);
    const createButton = queryByRole('button', { type: 'primary' });

    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveAttribute('disabled');
  });

  it('should', async () => {
    const { queryByRole, queryByTestId } = renderWithProvider(
      <NewAccount {...props} />,
    );

    const password = 'a-new-password';

    const checkTerms = queryByRole('checkbox');

    const createPassword = queryByTestId('create-password');
    const confirmPassword = queryByTestId('confirm-password');

    const createButton = queryByRole('button', { type: 'primary' });
    fireEvent.click(checkTerms);
    fireEvent.change(createPassword, { target: { value: password } });
    fireEvent.change(confirmPassword, { target: { value: password } });

    expect(createButton).not.toHaveAttribute('disabled');

    fireEvent.click(createButton);

    await waitFor(() => {
      expect(props.history.push).toHaveBeenCalledWith(
        INITIALIZE_SEED_PHRASE_INTRO_ROUTE,
      );
    });
  });

  it('should error when the password and the confirm password are not the same', () => {
    const { queryByRole, queryByTestId, queryByText } = renderWithProvider(
      <NewAccount {...props} />,
    );

    const password = 'a-new-password';
    const wrongPassword = 'wrong-password';

    const createPassword = queryByTestId('create-password');
    const confirmPassword = queryByTestId('confirm-password');

    fireEvent.change(createPassword, { target: { value: password } });
    fireEvent.change(confirmPassword, { target: { value: wrongPassword } });

    const errorMessage = queryByText(/passwordsDontMatch/u);
    expect(errorMessage).toBeInTheDocument();

    // Create button is disabled.
    const createButton = queryByRole('button', { type: 'primary' });
    expect(createButton).toHaveAttribute('disabled');
  });

  it('should disable the create button if the terms are not checked but passwords are correct', () => {
    const { queryByRole, queryByTestId } = renderWithProvider(
      <NewAccount {...props} />,
    );

    const password = 'a-new-password';

    const createPassword = queryByTestId('create-password');
    const confirmPassword = queryByTestId('confirm-password');

    fireEvent.change(createPassword, { target: { value: password } });
    fireEvent.change(confirmPassword, { target: { value: password } });

    const createButton = queryByRole('button', { type: 'primary' });
    expect(createButton).toHaveAttribute('disabled');
  });
});
