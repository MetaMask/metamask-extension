import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import {
  QR_SYNC_TIMEOUT_MS,
  QrSyncErrorCode,
  QrSyncErrorCodes,
} from '../../../../../shared/constants/qr-sync';
import { submitRequestToBackground } from '../../../../store/background-connection';
import EnterVerificationCode from './enter-verification-code';

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

type QrSyncError = {
  code: QrSyncErrorCode;
  message: string;
};

const SESSION_NOW = 1_000_000;

const renderComponent = (
  qrSyncError: QrSyncError | null = null,
  onRestart: () => void = jest.fn(),
  isAwaitingSyncOffer = false,
  qrSyncExpiresAt: number | null = null,
) => {
  const store = configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      qrSyncError,
      qrSyncExpiresAt,
    },
  });
  return {
    onRestart,
    ...renderWithProvider(
      <EnterVerificationCode
        onRestart={onRestart}
        isAwaitingSyncOffer={isAwaitingSyncOffer}
      />,
      store,
    ),
  };
};

const getInput = () => screen.getByTestId('qr-sync-otp-input');

const typeCode = (code: string) => {
  fireEvent.change(getInput(), { target: { value: code } });
};

describe('EnterVerificationCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  it('renders the heading, description and six flexible code cells', () => {
    renderComponent();

    expect(
      screen.getByText(messages.enter_verification_code.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.enter_verification_code_desc.message),
    ).toBeInTheDocument();
    expect(getInput()).toBeInTheDocument();
    expect(screen.queryByText(/expires in/iu)).not.toBeInTheDocument();
    for (let index = 0; index < 6; index++) {
      expect(screen.getByTestId(`qr-sync-otp-cell-${index}`)).toHaveClass(
        'flex-1',
        'bg-muted',
      );
    }
  });

  it('submits the OTP when six digits are entered', async () => {
    renderComponent();

    typeCode('123456');

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'QrSyncController:submitOtp',
        ['123456'],
      );
    });
  });

  it('shows a verifying indicator while the OTP is being submitted', async () => {
    mockSubmitRequestToBackground.mockImplementation(
      () => new Promise(() => undefined),
    );
    renderComponent();

    typeCode('123456');

    expect(
      await screen.findByTestId('qr-sync-otp-verifying'),
    ).toHaveTextContent(messages.mfaOtpVerifying.message);
    expect(getInput()).toBeDisabled();
    expect(screen.getByTestId('qr-sync-otp-verifying')).toHaveAttribute(
      'data-awaiting-sync-offer',
      'false',
    );
  });

  it('marks the verifying indicator once the wallet sync offer is awaited', () => {
    renderComponent(null, jest.fn(), true);

    expect(screen.getByTestId('qr-sync-otp-verifying')).toHaveAttribute(
      'data-awaiting-sync-offer',
      'true',
    );
  });

  it('shows connecting guidance when the phone reply takes longer than the delay', () => {
    jest.useFakeTimers();
    renderComponent(null, jest.fn(), true);

    expect(screen.getByTestId('qr-sync-otp-verifying')).toHaveTextContent(
      messages.mfaOtpVerifying.message,
    );
    expect(getInput()).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1199);
    });
    expect(
      screen.queryByText(messages.qrSyncStillConnecting.message),
    ).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(
      screen.getByText(messages.qrSyncStillConnecting.message),
    ).toBeInTheDocument();
    expect(screen.getByTestId('qr-sync-otp-verifying')).toHaveClass('w-full');
    expect(screen.getByTestId('qr-sync-otp-verifying')).toHaveAttribute(
      'aria-label',
      messages.qrSyncStillConnecting.message,
    );
  });

  it('keeps the connecting state when the code deadline passes while awaiting the sync offer', () => {
    jest.useFakeTimers();
    jest.setSystemTime(SESSION_NOW);
    const { onRestart } = renderComponent(
      null,
      jest.fn(),
      true,
      SESSION_NOW + QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT,
    );

    act(() => {
      jest.advanceTimersByTime(QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT);
    });

    expect(screen.getByTestId('qr-sync-otp-verifying')).toBeInTheDocument();
    expect(
      screen.queryByText(messages.enter_verification_code_expired.message),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('qr-sync-otp-try-again'),
    ).not.toBeInTheDocument();
    expect(onRestart).not.toHaveBeenCalled();
  });

  it('shows an error message when OTP submission fails', async () => {
    mockSubmitRequestToBackground.mockRejectedValue(new Error('invalid otp'));
    renderComponent();

    typeCode('123456');

    expect(
      await screen.findByText(messages.enter_verification_code_error.message),
    ).toBeInTheDocument();
    expect(getInput()).toHaveValue('');
    for (let index = 0; index < 6; index++) {
      const cell = screen.getByTestId(`qr-sync-otp-cell-${index}`);
      expect(cell).not.toHaveTextContent(/[0-9]/u);
      expect(cell).not.toHaveClass('border-error-default');
    }
    expect(screen.getByTestId('qr-sync-otp-cell-0')).toHaveClass(
      'border-primary-default',
    );
    expect(
      screen.getByText(messages.enter_verification_code_error.message),
    ).toHaveAttribute('role', 'alert');
    expect(
      screen.queryByTestId('qr-sync-start-with-new-qr-code'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('qr-sync-otp-try-again'),
    ).not.toBeInTheDocument();
  });

  it('shows the max-attempts message and disables the input', () => {
    renderComponent({
      code: QrSyncErrorCodes.OTP_ATTEMPTS_EXCEEDED,
      message: 'Too many attempts.',
    });

    expect(
      screen.getByText(messages.enter_verification_code_max_attempts.message),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('qr-sync-otp-verifying'),
    ).not.toBeInTheDocument();
    expect(getInput()).toBeDisabled();
    expect(screen.getByTestId('qr-sync-otp-try-again')).toHaveClass(
      'w-full',
      'mt-auto',
    );
    expect(screen.getByTestId('qr-sync-otp-try-again')).toHaveTextContent(
      messages.enter_verification_code_try_again.message,
    );
  });

  it('shows the expired message and restarts the flow on request', () => {
    jest.useFakeTimers();
    jest.setSystemTime(SESSION_NOW);
    const { onRestart } = renderComponent(
      null,
      jest.fn(),
      false,
      SESSION_NOW + QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT,
    );

    act(() => {
      jest.advanceTimersByTime(QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT);
    });

    expect(
      screen.getByText(messages.enter_verification_code_expired.message),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('qr-sync-start-with-new-qr-code'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('qr-sync-otp-try-again'));

    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});
