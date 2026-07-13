import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithLocalization } from '../../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import { QR_SYNC_TIMEOUT_MS } from '../../../../../shared/constants/qr-sync';
import { submitRequestToBackground } from '../../../../store/background-connection';
import EnterVerificationCode from './enter-verification-code';

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

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
    renderWithLocalization(<EnterVerificationCode />);

    expect(
      screen.getByText(messages.enter_verification_code.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.enter_verification_code_desc.message),
    ).toBeInTheDocument();
    expect(getInputs()).toHaveLength(6);
  });

  it('submits the OTP when six digits are entered', async () => {
    renderWithLocalization(<EnterVerificationCode />);

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
    renderWithLocalization(<EnterVerificationCode />);

    typeCode('123456');

    expect(
      await screen.findByText(messages.enter_verification_code_error.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.start_with_new_qr_code.message),
    ).toBeInTheDocument();
  });

  it('requests a new session when restart is clicked after an error', async () => {
    mockSubmitRequestToBackground
      .mockRejectedValueOnce(new Error('invalid otp'))
      .mockResolvedValueOnce(undefined);
    renderWithLocalization(<EnterVerificationCode />);

    typeCode('111111');

    await screen.findByText(messages.enter_verification_code_error.message);

    fireEvent.click(screen.getByText(messages.start_with_new_qr_code.message));

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenLastCalledWith(
        'messengerCall',
        ['QrSyncController:createSession', []],
      );
    });
  });

  it('shows the expired message and restart button after the timer runs out', () => {
    jest.useFakeTimers();
    renderWithLocalization(<EnterVerificationCode />);

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
