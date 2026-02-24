import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { I18nContext } from '../../../contexts/i18n';
import { getMessage } from '../../../helpers/utils/i18n-helper';
import * as en from '../../../../app/_locales/en/messages.json';
import { TrustSignalDisplayState } from '../../../hooks/useTrustSignals';
import { TrustSignalModal } from './trust-signal-modal';

const t = (key: string, ...args: string[]) =>
  getMessage('en', en, key, ...args);

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nContext.Provider value={t}>{ui}</I18nContext.Provider>);
}

describe('TrustSignalModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Warning variant', () => {
    const defaultProps = {
      origin: 'https://suspicious-site.example.com',
      state: TrustSignalDisplayState.Warning as const,
      onContinue: jest.fn(),
    };

    it('renders with the hostname visible', () => {
      const { getByText, getByTestId } = renderWithI18n(
        <TrustSignalModal {...defaultProps} />,
      );

      expect(getByTestId('trust-signal-warning-modal')).toBeInTheDocument();
      expect(getByText('suspicious-site.example.com')).toBeInTheDocument();
    });

    it('shows "Unverified site" title', () => {
      const { getByText } = renderWithI18n(
        <TrustSignalModal {...defaultProps} />,
      );

      expect(getByText('Unverified site')).toBeInTheDocument();
    });

    it('calls onContinue when "Connect Anyway" is clicked', () => {
      const { getByTestId } = renderWithI18n(
        <TrustSignalModal {...defaultProps} />,
      );

      fireEvent.click(getByTestId('trust-signal-warning-modal-continue'));
      expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
    });
  });

  describe('Malicious variant', () => {
    const defaultProps = {
      origin: 'https://malicious-site.example.com',
      state: TrustSignalDisplayState.Malicious as const,
      onContinue: jest.fn(),
    };

    it('renders with the hostname visible', () => {
      const { getByText, getByTestId } = renderWithI18n(
        <TrustSignalModal {...defaultProps} />,
      );

      expect(getByTestId('trust-signal-block-modal')).toBeInTheDocument();
      expect(getByText('malicious-site.example.com')).toBeInTheDocument();
    });

    it('shows "Malicious site detected" title', () => {
      const { getByText } = renderWithI18n(
        <TrustSignalModal {...defaultProps} />,
      );

      expect(getByText('Malicious site detected')).toBeInTheDocument();
    });

    it('calls onContinue when "Connect Anyway" is clicked', () => {
      const { getByTestId } = renderWithI18n(
        <TrustSignalModal {...defaultProps} />,
      );

      fireEvent.click(getByTestId('trust-signal-block-modal-continue'));
      expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
    });
  });
});
