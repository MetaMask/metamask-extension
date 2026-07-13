import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import { QR_SYNC_TIMEOUT_MS, QrSyncErrorCode, QrSyncErrorCodes } from '../../../../../shared/constants/qr-sync';
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

const renderComponent = (
  onRestart: () => void = jest.fn(),
  qrSyncError: QrSyncError | null = null,
) => {
  const store = configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      qrSyncError,
    },
  });
  return renderWithProvider(
    <EnterVerificationCode onRestart={onRestart} />,
    store,
  );
};

const getInputs = () =>
  Array.from(document.querySelectorAll('input')) as HTMLInputElement[];

const typeCode = (code: string) => {
  const inputs = getInputs();
  code.split('').forEach((digit, index) => {
    fireEvent.change(inputs[index], { target: { value: digit } });
  });
};

describe('EnterVerificationCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the heading, description and six inputs', () => {
    renderComponent();

    expect(
      screen.getByText(messages.enter_verification_code.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.enter_verification_code_desc.message),
    ).toBeInTheDocument();
    expect(getInputs()).toHaveLength(6);
  });

  it('submits the OTP when six digits are entered', async () => {
    renderComponent();

    typeCode('123456');

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'messengerCall',
        ['QrSyncController:submitOtp', ['123456']],
      );
    });
  });

  it('shows an error message when OTP submission fails', async () => {
    mockSubmitRequestToBackground.mockRejectedValue(new Error('invalid otp'));
    renderComponent();

    typeCode('123456');

    expect(
      await screen.findByText(messages.enter_verification_code_error.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.start_with_new_qr_code.message),
    ).toBeInTheDocument();
  });

  it('calls onRestart when restart is clicked after an error', async () => {
    mockSubmitRequestToBackground.mockRejectedValue(new Error('invalid otp'));
    const onRestart = jest.fn();
    renderComponent(onRestart);

    typeCode('111111');

    await screen.findByText(messages.enter_verification_code_error.message);

    fireEvent.click(screen.getByText(messages.start_with_new_qr_code.message));

    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it('shows the max-attempts message, restart button and disables the inputs', () => {
    renderComponent(jest.fn(), {
      code: QrSyncErrorCodes.OTP_ATTEMPTS_EXCEEDED,
      message: 'Too many attempts.',
    });

    expect(
      screen.getByText(messages.enter_verification_code_max_attempts.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.start_with_new_qr_code.message),
    ).toBeInTheDocument();
    getInputs().forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it('shows the expired message and restart button after the timer runs out', () => {
    jest.useFakeTimers();
    renderComponent();

    act(() => {
      jest.advanceTimersByTime(QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT);
    });

    expect(
      screen.getByText(messages.enter_verification_code_expired.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.start_with_new_qr_code.message),
    ).toBeInTheDocument();
  });
});
