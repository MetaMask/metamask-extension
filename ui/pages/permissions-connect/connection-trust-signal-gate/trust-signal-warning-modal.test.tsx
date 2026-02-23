import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { I18nContext } from '../../../contexts/i18n';
import { getMessage } from '../../../helpers/utils/i18n-helper';
import * as en from '../../../../app/_locales/en/messages.json';
import { TrustSignalWarningModal } from './trust-signal-warning-modal';

const t = (key: string, ...args: string[]) =>
  getMessage('en', en, key, ...args);

function renderWithI18n(ui: React.ReactElement) {
  return render(
    <I18nContext.Provider value={t}>{ui}</I18nContext.Provider>,
  );
}

describe('TrustSignalWarningModal', () => {
  const defaultProps = {
    origin: 'https://suspicious-site.example.com',
    onContinue: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with the hostname visible', () => {
    const { getByText, getByTestId } = renderWithI18n(
      <TrustSignalWarningModal {...defaultProps} />,
    );

    expect(getByTestId('trust-signal-warning-modal')).toBeInTheDocument();
    expect(getByText('suspicious-site.example.com')).toBeInTheDocument();
  });

  it('shows "Unverified site" title', () => {
    const { getByText } = renderWithI18n(
      <TrustSignalWarningModal {...defaultProps} />,
    );

    expect(getByText('Unverified site')).toBeInTheDocument();
  });

  it('calls onContinue when "Connect Anyway" is clicked', () => {
    const { getByTestId } = renderWithI18n(
      <TrustSignalWarningModal {...defaultProps} />,
    );

    fireEvent.click(getByTestId('trust-signal-warning-continue'));
    expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
  });
});
