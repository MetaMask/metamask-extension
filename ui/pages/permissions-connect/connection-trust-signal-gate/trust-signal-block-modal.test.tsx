import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { I18nContext } from '../../../contexts/i18n';
import { getMessage } from '../../../helpers/utils/i18n-helper';
import * as en from '../../../../app/_locales/en/messages.json';
import { TrustSignalBlockModal } from './trust-signal-block-modal';

const t = (key: string, ...args: string[]) =>
  getMessage('en', en, key, ...args);

function renderWithI18n(ui: React.ReactElement) {
  return render(
    <I18nContext.Provider value={t}>{ui}</I18nContext.Provider>,
  );
}

describe('TrustSignalBlockModal', () => {
  const defaultProps = {
    origin: 'https://malicious-site.example.com',
    onContinue: jest.fn(),
    onGoBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with the hostname visible', () => {
    const { getByText, getByTestId } = renderWithI18n(
      <TrustSignalBlockModal {...defaultProps} />,
    );

    expect(getByTestId('trust-signal-block-modal')).toBeInTheDocument();
    expect(getByText('malicious-site.example.com')).toBeInTheDocument();
  });

  it('has continue button disabled by default', () => {
    const { getByTestId } = renderWithI18n(
      <TrustSignalBlockModal {...defaultProps} />,
    );

    expect(getByTestId('trust-signal-block-continue')).toBeDisabled();
  });

  it('enables continue button after checkbox is checked', () => {
    const { getByTestId } = renderWithI18n(
      <TrustSignalBlockModal {...defaultProps} />,
    );

    fireEvent.click(getByTestId('trust-signal-block-checkbox'));
    expect(getByTestId('trust-signal-block-continue')).not.toBeDisabled();
  });

  it('calls onContinue when checkbox is checked and continue is clicked', () => {
    const { getByTestId } = renderWithI18n(
      <TrustSignalBlockModal {...defaultProps} />,
    );

    fireEvent.click(getByTestId('trust-signal-block-checkbox'));
    fireEvent.click(getByTestId('trust-signal-block-continue'));
    expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
  });

  it('calls onGoBack when go back button is clicked', () => {
    const { getByTestId } = renderWithI18n(
      <TrustSignalBlockModal {...defaultProps} />,
    );

    fireEvent.click(getByTestId('trust-signal-block-go-back'));
    expect(defaultProps.onGoBack).toHaveBeenCalledTimes(1);
  });
});
