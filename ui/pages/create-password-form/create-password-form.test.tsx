import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
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
      metamask: isInUSRegion ? { location: 'US-TX', country: 'US' } : {},
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

  it('renders an error message when error is true', () => {
    const { getByTestId } = renderWithProvider(
      <CreatePasswordForm
        isSocialLoginFlow={false}
        onSubmit={jest.fn()}
        onBack={jest.fn()}
        error
      />,
      createMockStore(),
    );

    expect(getByTestId('create-password-error')).toHaveTextContent(
      messages.notificationsSettingsBoxError.message,
    );
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
      expect(onSubmit).toHaveBeenCalledWith(password, true, true);
    });
  });

  describe('social login marketing checkbox decision', () => {
    const submitSocialLoginForm = async ({
      isInUSRegion,
      clicks,
    }: {
      isInUSRegion: boolean;
      clicks: number;
    }) => {
      const onSubmit = jest.fn();
      const { getByRole, getByTestId } = renderWithProvider(
        <CreatePasswordForm
          isSocialLoginFlow
          onSubmit={onSubmit}
          onBack={jest.fn()}
        />,
        createMockStore(isInUSRegion),
      );

      fireEvent.change(getByTestId('create-password-new-input'), {
        target: { value: '12345678' },
      });
      fireEvent.change(getByTestId('create-password-confirm-input'), {
        target: { value: '12345678' },
      });
      await waitFor(() => {
        expect(getByRole('checkbox')).toHaveProperty('checked', isInUSRegion);
      });
      for (let i = 0; i < clicks; i++) {
        fireEvent.click(getByRole('checkbox'));
      }
      fireEvent.click(getByTestId('create-password-submit'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });
      return onSubmit;
    };

    it('reports a decision when the box was checked by default and the user unchecked it', async () => {
      const onSubmit = await submitSocialLoginForm({
        isInUSRegion: true,
        clicks: 1,
      });

      expect(onSubmit).toHaveBeenCalledWith('12345678', false, true);
    });

    it('reports no decision when the box was unchecked by default and never touched', async () => {
      const onSubmit = await submitSocialLoginForm({
        isInUSRegion: false,
        clicks: 0,
      });

      expect(onSubmit).toHaveBeenCalledWith('12345678', false, false);
    });

    it('reports a decision when the user checks the box', async () => {
      const onSubmit = await submitSocialLoginForm({
        isInUSRegion: false,
        clicks: 1,
      });

      expect(onSubmit).toHaveBeenCalledWith('12345678', true, true);
    });

    it('reports a decision when the box was checked by default and left checked', async () => {
      const onSubmit = await submitSocialLoginForm({
        isInUSRegion: true,
        clicks: 0,
      });

      expect(onSubmit).toHaveBeenCalledWith('12345678', true, true);
    });

    it('reports a decision when the user checks and then unchecks the box', async () => {
      const onSubmit = await submitSocialLoginForm({
        isInUSRegion: false,
        clicks: 2,
      });

      expect(onSubmit).toHaveBeenCalledWith('12345678', false, true);
    });
  });
});
