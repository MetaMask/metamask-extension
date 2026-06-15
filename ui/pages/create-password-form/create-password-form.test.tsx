import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import * as Actions from '../../store/actions';
import { CreatePasswordForm } from '.';

jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  getGeolocation: jest.fn(),
}));

describe('CreatePasswordForm', () => {
  const mockGetGeolocation = jest.mocked(Actions.getGeolocation);

  beforeEach(() => {
    mockGetGeolocation.mockResolvedValue('CA');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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

  it('does not fetch geolocation for non-social login flow', () => {
    render(
      <CreatePasswordForm
        isSocialLoginFlow={false}
        onSubmit={jest.fn()}
        onBack={jest.fn()}
      />,
    );

    expect(mockGetGeolocation).not.toHaveBeenCalled();
  });

  it('defaults the marketing terms checkbox to checked for USA social-login users', async () => {
    mockGetGeolocation.mockResolvedValue('US');

    const { getByRole } = render(
      <CreatePasswordForm
        isSocialLoginFlow
        onSubmit={jest.fn()}
        onBack={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockGetGeolocation).toHaveBeenCalled();
      expect(getByRole('checkbox')).toBeChecked();
    });
  });

  it('defaults the marketing terms checkbox to unchecked for non-USA social-login users', async () => {
    const { getByRole } = render(
      <CreatePasswordForm
        isSocialLoginFlow
        onSubmit={jest.fn()}
        onBack={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockGetGeolocation).toHaveBeenCalled();
    });

    expect(getByRole('checkbox')).not.toBeChecked();
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
});
