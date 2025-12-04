import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import CreatePasswordForm from '.';

describe('CreatePasswordForm', () => {
  it('renders match snapshot', () => {
    const { container } = render(
      <CreatePasswordForm
        isSocialLoginFlow={false}
        onSubmit={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('onsubmit called with correct passwords and terms checked', async () => {
    const onSubmit = jest.fn();
    const { queryByTestId } = render(
      <CreatePasswordForm
        isSocialLoginFlow={false}
        onSubmit={onSubmit}
        onBack={jest.fn()}
      />,
    );

    const createPasswordInput = queryByTestId('create-password-new-input');
    const confirmPasswordInput = queryByTestId('create-password-confirm-input');

    const password = '12345678';

    const createPasswordEvent = {
      target: {
        value: password,
      },
    };
    const confirmPasswordEvent = {
      target: {
        value: password,
      },
    };

    expect(createPasswordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toBeInTheDocument();

    fireEvent.change(
      createPasswordInput as HTMLInputElement,
      createPasswordEvent,
    );
    fireEvent.change(
      confirmPasswordInput as HTMLInputElement,
      confirmPasswordEvent,
    );

    const terms = queryByTestId('create-password-terms');
    fireEvent.click(terms as HTMLInputElement);

    const createNewWalletButton = queryByTestId('create-password-submit');

    await waitFor(() => {
      expect(createNewWalletButton).not.toBeDisabled();
    });

    fireEvent.click(createNewWalletButton as HTMLButtonElement);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(password, true);
    });
  });

  it('initial passwords and terms checked are set correctly', () => {
    const { queryByTestId } = render(
      <CreatePasswordForm
        isSocialLoginFlow={false}
        onSubmit={jest.fn()}
        onBack={jest.fn()}
        initialPassword="12345678"
        initialConfirmPassword="12345678"
        initialTermsChecked={true}
      />,
    );

    const createPasswordInput = queryByTestId('create-password-new-input');
    const confirmPasswordInput = queryByTestId('create-password-confirm-input');
    const terms = queryByTestId('create-password-terms');

    expect(createPasswordInput).toHaveValue('12345678');
    expect(confirmPasswordInput).toHaveValue('12345678');
    expect(terms).toBeChecked();

    fireEvent.change(createPasswordInput as HTMLInputElement, {
      target: { value: '87654321' },
    });
    fireEvent.change(confirmPasswordInput as HTMLInputElement, {
      target: { value: '87654321' },
    });
    fireEvent.click(terms as HTMLInputElement);

    expect(createPasswordInput).toHaveValue('87654321');
    expect(confirmPasswordInput).toHaveValue('87654321');
    expect(terms).not.toBeChecked();
  });
});
