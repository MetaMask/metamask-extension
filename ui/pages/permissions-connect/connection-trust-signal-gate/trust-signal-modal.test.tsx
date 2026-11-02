import React from 'react';
import { render, fireEvent } from '@testing-library/react';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../app/_locales/en/messages.json';
import { TrustSignalModal } from '../../../components/app/trust-signal-modal/trust-signal-modal';

const MOCK_I18N: Record<string, string> = {
  continueAtYourOwnRisk: messages.continueAtYourOwnRisk.message,
  trustSignalPhishingWarning: messages.trustSignalPhishingWarning.message,
  connectAnyway: messages.connectAnyway.message,
  cancel: messages.cancel.message,
  close: messages.close.message,
};

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => MOCK_I18N[key] ?? key,
}));

describe('TrustSignalModal', () => {
  const defaultProps = {
    onContinue: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal', () => {
    const { getByTestId } = render(<TrustSignalModal {...defaultProps} />);

    expect(getByTestId('trust-signal-block-modal')).toBeInTheDocument();
  });

  it('shows "Continue at your own risk" title', () => {
    const { getByText } = render(<TrustSignalModal {...defaultProps} />);

    expect(
      getByText(messages.continueAtYourOwnRisk.message),
    ).toBeInTheDocument();
  });

  it('calls onContinue when "Connect anyway" is clicked', () => {
    const { getByTestId } = render(<TrustSignalModal {...defaultProps} />);

    fireEvent.click(getByTestId('trust-signal-block-modal-continue'));
    expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
  });

  it('renders cancel button', () => {
    const { getByTestId } = render(<TrustSignalModal {...defaultProps} />);

    expect(getByTestId('trust-signal-block-modal-cancel')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const { getByTestId } = render(<TrustSignalModal {...defaultProps} />);

    fireEvent.click(getByTestId('trust-signal-block-modal-cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });
});
