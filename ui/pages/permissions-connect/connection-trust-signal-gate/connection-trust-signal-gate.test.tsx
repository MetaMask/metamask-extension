import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { I18nContext } from '../../../contexts/i18n';
import { getMessage } from '../../../helpers/utils/i18n-helper';
import * as en from '../../../../app/_locales/en/messages.json';
import { TrustSignalDisplayState } from '../../../hooks/useTrustSignals';
import { useOriginTrustSignals } from '../../../hooks/useOriginTrustSignals';
import { ConnectionTrustSignalGate } from './connection-trust-signal-gate';

jest.mock('../../../hooks/useOriginTrustSignals', () => ({
  useOriginTrustSignals: jest.fn(),
}));

const mockUseOriginTrustSignals = useOriginTrustSignals as jest.Mock;

const t = (key: string, ...args: string[]) =>
  getMessage('en', en, key, ...args);

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nContext.Provider value={t}>{ui}</I18nContext.Provider>);
}

describe('ConnectionTrustSignalGate', () => {
  const defaultProps = {
    origin: 'https://example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when trust state is Unknown', () => {
    mockUseOriginTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });

    const { getByText } = renderWithI18n(
      <ConnectionTrustSignalGate {...defaultProps}>
        <div>Child content</div>
      </ConnectionTrustSignalGate>,
    );

    expect(getByText('Child content')).toBeInTheDocument();
  });

  it('renders children when trust state is Verified (no modal)', () => {
    mockUseOriginTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Verified,
      label: null,
    });

    const { getByText, queryByTestId } = renderWithI18n(
      <ConnectionTrustSignalGate {...defaultProps}>
        <div>Child content</div>
      </ConnectionTrustSignalGate>,
    );

    expect(getByText('Child content')).toBeInTheDocument();
    expect(queryByTestId('trust-signal-warning-modal')).not.toBeInTheDocument();
    expect(queryByTestId('trust-signal-block-modal')).not.toBeInTheDocument();
  });

  it('renders warning modal when trust state is Warning', () => {
    mockUseOriginTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Warning,
      label: null,
    });

    const { getByTestId, queryByText } = renderWithI18n(
      <ConnectionTrustSignalGate {...defaultProps}>
        <div>Child content</div>
      </ConnectionTrustSignalGate>,
    );

    expect(getByTestId('trust-signal-warning-modal')).toBeInTheDocument();
    expect(queryByText('Child content')).not.toBeInTheDocument();
  });

  it('renders block modal when trust state is Malicious', () => {
    mockUseOriginTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Malicious,
      label: null,
    });

    const { getByTestId, queryByText } = renderWithI18n(
      <ConnectionTrustSignalGate {...defaultProps}>
        <div>Child content</div>
      </ConnectionTrustSignalGate>,
    );

    expect(getByTestId('trust-signal-block-modal')).toBeInTheDocument();
    expect(queryByText('Child content')).not.toBeInTheDocument();
  });

  it('shows children after dismissing warning modal', () => {
    mockUseOriginTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Warning,
      label: null,
    });

    const { getByTestId, getByText, queryByTestId } = renderWithI18n(
      <ConnectionTrustSignalGate {...defaultProps}>
        <div>Child content</div>
      </ConnectionTrustSignalGate>,
    );

    fireEvent.click(getByTestId('trust-signal-warning-modal-continue'));
    expect(queryByTestId('trust-signal-warning-modal')).not.toBeInTheDocument();
    expect(getByText('Child content')).toBeInTheDocument();
  });

  it('shows children after dismissing block modal', () => {
    mockUseOriginTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Malicious,
      label: null,
    });

    const { getByTestId, getByText, queryByTestId } = renderWithI18n(
      <ConnectionTrustSignalGate {...defaultProps}>
        <div>Child content</div>
      </ConnectionTrustSignalGate>,
    );

    fireEvent.click(getByTestId('trust-signal-block-modal-continue'));
    expect(queryByTestId('trust-signal-block-modal')).not.toBeInTheDocument();
    expect(getByText('Child content')).toBeInTheDocument();
  });
});
