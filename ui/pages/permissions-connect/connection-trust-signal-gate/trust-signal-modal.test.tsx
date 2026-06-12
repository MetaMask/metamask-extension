import React from 'react';
import { render, fireEvent } from '@testing-library/react';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../app/_locales/en/messages.json';
import { TrustSignalModal } from './trust-signal-modal';

const MOCK_I18N: Record<string, string> = {
  trustSignalBlockTitle: messages.trustSignalBlockTitle.message,
  trustSignalBlockDescription: messages.trustSignalBlockDescription.message,
  trustSignalContinueAnyway: messages.trustSignalContinueAnyway.message,
  cancel: messages.cancel.message,
};

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => MOCK_I18N[key] ?? key,
}));

describe('TrustSignalModal', () => {
  const defaultProps = {
    origin: 'https://malicious-site.example.com',
    onContinue: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with the hostname visible', () => {
    const { getByText, getByTestId } = render(
      <TrustSignalModal {...defaultProps} />,
    );

    expect(getByTestId('trust-signal-block-modal')).toBeInTheDocument();
    expect(getByText('malicious-site.example.com')).toBeInTheDocument();
  });

  it('shows "Malicious site detected" title', () => {
    const { getByText } = render(<TrustSignalModal {...defaultProps} />);

    expect(
      getByText(messages.trustSignalBlockTitle.message),
    ).toBeInTheDocument();
  });

  it('calls onContinue when "Connect Anyway" is clicked', () => {
    const { getByTestId } = render(<TrustSignalModal {...defaultProps} />);

    fireEvent.click(getByTestId('trust-signal-block-modal-continue'));
    expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
  });

  it('renders cancel button when onCancel is provided', () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <TrustSignalModal {...defaultProps} onCancel={onCancel} />,
    );

    expect(getByTestId('trust-signal-block-modal-cancel')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <TrustSignalModal {...defaultProps} onCancel={onCancel} />,
    );

    fireEvent.click(getByTestId('trust-signal-block-modal-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not render cancel button when onCancel is not provided', () => {
    const { queryByTestId } = render(<TrustSignalModal {...defaultProps} />);

    expect(
      queryByTestId('trust-signal-block-modal-cancel'),
    ).not.toBeInTheDocument();
  });
});
