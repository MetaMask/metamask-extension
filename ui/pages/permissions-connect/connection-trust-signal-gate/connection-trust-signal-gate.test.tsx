import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TrustSignalDisplayState } from '../../../hooks/useTrustSignals';
import { useOriginTrustSignals } from '../../../hooks/useOriginTrustSignals';
import { ConnectionTrustSignalGate } from './connection-trust-signal-gate';

jest.mock('../../../hooks/useOriginTrustSignals', () => ({
  useOriginTrustSignals: jest.fn(),
}));

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

const mockUseOriginTrustSignals = useOriginTrustSignals as jest.Mock;

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

    const { getByText } = render(
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

    const { getByText, queryByTestId } = render(
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

    const { getByTestId, queryByText } = render(
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

    const { getByTestId, queryByText } = render(
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

    const { getByTestId, getByText, queryByTestId } = render(
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

    const { getByTestId, getByText, queryByTestId } = render(
      <ConnectionTrustSignalGate {...defaultProps}>
        <div>Child content</div>
      </ConnectionTrustSignalGate>,
    );

    fireEvent.click(getByTestId('trust-signal-block-modal-continue'));
    expect(queryByTestId('trust-signal-block-modal')).not.toBeInTheDocument();
    expect(getByText('Child content')).toBeInTheDocument();
  });
});
