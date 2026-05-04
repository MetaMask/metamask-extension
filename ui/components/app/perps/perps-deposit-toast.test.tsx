import React from 'react';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { submitRequestToBackground } from '../../../store/background-connection';
import { PerpsDepositToast } from './perps-deposit-toast';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

describe('PerpsDepositToast', () => {
  const submitRequestToBackgroundMock = jest.mocked(submitRequestToBackground);

  beforeEach(() => {
    submitRequestToBackgroundMock.mockReset();
    submitRequestToBackgroundMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when there is no deposit state', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        depositInProgress: false,
        lastDepositResult: null,
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(screen.queryByTestId('perps-deposit-toast')).not.toBeInTheDocument();
  });

  it('renders in-progress toast when deposit is in progress', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        depositInProgress: true,
        lastDepositTransactionId: 'pending-tx-1',
        lastDepositResult: null,
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(screen.getByTestId('perps-deposit-toast')).toBeInTheDocument();
    expect(
      screen.getByText(messages.perpsDepositToastPendingTitle.message),
    ).toBeInTheDocument();
  });

  it('renders success toast when lastDepositResult is successful', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        depositInProgress: false,
        lastDepositResult: {
          success: true,
          error: '',
          timestamp: 1_700_000_000_000,
        },
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(screen.getByTestId('perps-deposit-toast')).toBeInTheDocument();
    expect(
      screen.getByText(messages.perpsDepositToastSuccessTitle.message),
    ).toBeInTheDocument();
  });

  it('renders error toast when lastDepositResult is unsuccessful', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        depositInProgress: false,
        lastDepositResult: {
          success: false,
          error: 'Bridge failed',
          timestamp: 1_700_000_000_000,
        },
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(
      screen.getByText(messages.perpsDepositToastErrorTitle.message),
    ).toBeInTheDocument();
    expect(screen.getByText('Bridge failed')).toBeInTheDocument();
  });

  it('hides completion toast after auto-hide', () => {
    jest.useFakeTimers();

    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        depositInProgress: false,
        lastDepositResult: {
          success: true,
          error: '',
          timestamp: 1_700_000_000_000,
        },
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    act(() => {
      jest.advanceTimersByTime(5_000);
    });

    expect(screen.queryByTestId('perps-deposit-toast')).not.toBeInTheDocument();
    expect(submitRequestToBackgroundMock).toHaveBeenCalledWith(
      'perpsClearDepositResult',
      [],
    );
  });

  it('shows a new completion toast after dismissing an older one', async () => {
    const user = userEvent.setup();
    const initialStore = configureStore({
      metamask: {
        ...mockState.metamask,
        depositInProgress: false,
        lastDepositResult: {
          success: true,
          error: '',
          timestamp: 1_700_000_000_000,
        },
      },
    });

    const { unmount } = renderWithProvider(<PerpsDepositToast />, initialStore);

    await user.click(
      screen.getByRole('button', { name: messages.close.message }),
    );

    expect(screen.queryByTestId('perps-deposit-toast')).not.toBeInTheDocument();

    unmount();

    const nextStore = configureStore({
      metamask: {
        ...mockState.metamask,
        depositInProgress: false,
        lastDepositResult: {
          success: true,
          error: '',
          timestamp: 1_700_000_000_001,
        },
      },
    });

    renderWithProvider(<PerpsDepositToast />, nextStore);

    expect(screen.getByTestId('perps-deposit-toast')).toBeInTheDocument();
  });

  it('clears the deposit result when the completion toast is dismissed', async () => {
    const user = userEvent.setup();
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        depositInProgress: false,
        lastDepositResult: {
          success: true,
          error: '',
          timestamp: 1_700_000_000_000,
        },
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    await user.click(
      screen.getByRole('button', { name: messages.close.message }),
    );

    expect(submitRequestToBackgroundMock).toHaveBeenCalledWith(
      'perpsClearDepositResult',
      [],
    );
  });

  it('dismisses a completion toast without a numeric timestamp', async () => {
    const user = userEvent.setup();
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        depositInProgress: false,
        lastDepositResult: {
          success: false,
          error: 'Bridge failed',
        },
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    await user.click(
      screen.getByRole('button', { name: messages.close.message }),
    );

    expect(screen.queryByTestId('perps-deposit-toast')).not.toBeInTheDocument();
    expect(submitRequestToBackgroundMock).toHaveBeenCalledWith(
      'perpsClearDepositResult',
      [],
    );
  });

  it('prefers the completion toast when a result and in-progress state coexist', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        depositInProgress: true,
        lastDepositTransactionId: 'pending-tx-1',
        lastDepositResult: {
          success: true,
          error: '',
          timestamp: 1_700_000_000_000,
        },
      },
    });

    renderWithProvider(<PerpsDepositToast />, store);

    expect(
      screen.getByText(messages.perpsDepositToastSuccessTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(messages.perpsDepositToastPendingTitle.message),
    ).not.toBeInTheDocument();
  });
});
