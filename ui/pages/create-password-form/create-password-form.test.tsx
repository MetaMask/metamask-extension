import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { CreatePasswordForm } from '.';

const mockTrackEvent = jest.fn();

jest.mock('../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
      createEventBuilder,
    }),
  };
});

describe('CreatePasswordForm', () => {
  const createMockStore = (isInUSRegion: boolean = false) =>
    configureMockStore([thunk])({
      metamask: {
        location: isInUSRegion ? 'US' : undefined,
      },
    });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders match snapshot', () => {
    const { container } = renderWithProvider(
      <CreatePasswordForm
        isSocialLoginFlow={false}
        onSubmit={jest.fn()}
        onBack={jest.fn()}
      />,
      createMockStore(),
    );
    expect(container).toMatchSnapshot();
  });

  it('defaults the marketing terms checkbox to checked for Social login users in US region', async () => {
    const { getByRole } = renderWithProvider(
      <CreatePasswordForm
        isSocialLoginFlow
        onSubmit={jest.fn()}
        onBack={jest.fn()}
      />,
      createMockStore(true),
    );

    await waitFor(() => {
      expect(getByRole('checkbox')).toBeChecked();
    });
  });

  it('defaults the marketing terms checkbox to unchecked when marketing consent is not stored', () => {
    const { getByRole } = renderWithProvider(
      <CreatePasswordForm
        isSocialLoginFlow
        onSubmit={jest.fn()}
        onBack={jest.fn()}
      />,
      createMockStore(false),
    );

    expect(getByRole('checkbox')).not.toBeChecked();
  });

  it('onsubmit called with correct passwords and terms checked', async () => {
    const onSubmit = jest.fn();
    const { queryByTestId } = renderWithProvider(
      <CreatePasswordForm
        isSocialLoginFlow={false}
        onSubmit={onSubmit}
        onBack={jest.fn()}
      />,
      createMockStore(),
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
