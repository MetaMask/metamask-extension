import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TrustSignalDisplayState } from '../../../hooks/useTrustSignals';
import { TrustSignalModal } from './trust-signal-modal';

const MOCK_I18N: Record<string, string> = {
  trustSignalWarningTitle: 'Unverified site',
  trustSignalWarningDescription:
    'This site has not been verified. Proceed with caution when connecting.',
  trustSignalBlockTitle: 'Malicious site detected',
  trustSignalBlockDescription:
    'If you connect to this site, you could lose all your assets.',
  trustSignalContinueAnyway: 'Connect Anyway',
};

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => MOCK_I18N[key] ?? key,
}));

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
      const { getByText, getByTestId } = render(
        <TrustSignalModal {...defaultProps} />,
      );

      expect(getByTestId('trust-signal-warning-modal')).toBeInTheDocument();
      expect(getByText('suspicious-site.example.com')).toBeInTheDocument();
    });

    it('shows "Unverified site" title', () => {
      const { getByText } = render(
        <TrustSignalModal {...defaultProps} />,
      );

      expect(getByText('Unverified site')).toBeInTheDocument();
    });

    it('calls onContinue when "Connect Anyway" is clicked', () => {
      const { getByTestId } = render(
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
      const { getByText, getByTestId } = render(
        <TrustSignalModal {...defaultProps} />,
      );

      expect(getByTestId('trust-signal-block-modal')).toBeInTheDocument();
      expect(getByText('malicious-site.example.com')).toBeInTheDocument();
    });

    it('shows "Malicious site detected" title', () => {
      const { getByText } = render(
        <TrustSignalModal {...defaultProps} />,
      );

      expect(getByText('Malicious site detected')).toBeInTheDocument();
    });

    it('calls onContinue when "Connect Anyway" is clicked', () => {
      const { getByTestId } = render(
        <TrustSignalModal {...defaultProps} />,
      );

      fireEvent.click(getByTestId('trust-signal-block-modal-continue'));
      expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
    });
  });
});
