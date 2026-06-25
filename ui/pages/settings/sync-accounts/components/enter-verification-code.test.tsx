import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import { SyncAccountsStep } from '../constant';
import EnterVerificationCode from './enter-verification-code';

const getInputs = () =>
  Array.from(document.querySelectorAll('input')) as HTMLInputElement[];

const typeCode = (code: string) => {
  const inputs = getInputs();
  code.split('').forEach((digit, index) => {
    fireEvent.change(inputs[index], { target: { value: digit } });
  });
};

describe('EnterVerificationCode', () => {
  it('renders the heading, description and six inputs', () => {
    renderWithLocalization(<EnterVerificationCode onContinue={jest.fn()} />);

    expect(
      screen.getByText(messages.enter_verification_code.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.enter_verification_code_desc.message),
    ).toBeInTheDocument();
    expect(getInputs()).toHaveLength(6);
  });

  it('continues to the ValidatingDevice step when the correct code is entered', () => {
    const onContinue = jest.fn();
    renderWithLocalization(<EnterVerificationCode onContinue={onContinue} />);

    typeCode('123456');

    expect(onContinue).toHaveBeenCalledWith(
      SyncAccountsStep.ValidatingDevice,
    );
  });

  it('shows an error and a restart button when the code is incorrect', () => {
    const onContinue = jest.fn();
    renderWithLocalization(<EnterVerificationCode onContinue={onContinue} />);

    typeCode('111111');

    expect(
      screen.getByText(messages.enter_verification_code_error.message),
    ).toBeInTheDocument();
    expect(onContinue).not.toHaveBeenCalledWith(
      SyncAccountsStep.ValidatingDevice,
    );

    fireEvent.click(screen.getByText(messages.start_with_new_qr_code.message));

    expect(onContinue).toHaveBeenCalledWith(SyncAccountsStep.ScanQrCode);
  });
});
