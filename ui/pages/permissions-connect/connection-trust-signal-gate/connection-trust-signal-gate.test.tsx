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
    onCancel: jest.fn(),
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

  it('renders children when trust state is Verified', () => {
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
    expect(queryByTestId('trust-signal-block-modal')).not.toBeInTheDocument();
  });

  it('renders children when trust state is Warning', () => {
    mockUseOriginTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Warning,
      label: null,
    });

    const { getByText, queryByTestId } = render(
      <ConnectionTrustSignalGate {...defaultProps}>
        <div>Child content</div>
      </ConnectionTrustSignalGate>,
    );

    expect(getByText('Child content')).toBeInTheDocument();
    expect(queryByTestId('trust-signal-block-modal')).not.toBeInTheDocument();
  });

  it('renders block modal on top of children when trust state is Malicious', () => {
    mockUseOriginTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Malicious,
      label: null,
    });

    const { getByTestId, getByText } = render(
      <ConnectionTrustSignalGate {...defaultProps}>
        <div>Child content</div>
      </ConnectionTrustSignalGate>,
    );

    expect(getByTestId('trust-signal-block-modal')).toBeInTheDocument();
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

  it('calls onCancel when cancel button is clicked in block modal', () => {
    mockUseOriginTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Malicious,
      label: null,
    });

    const onCancel = jest.fn();

    const { getByTestId } = render(
      <ConnectionTrustSignalGate {...defaultProps} onCancel={onCancel}>
        <div>Child content</div>
      </ConnectionTrustSignalGate>,
    );

    fireEvent.click(getByTestId('trust-signal-block-modal-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders X.com warning modal for x.com origin', () => {
    mockUseOriginTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });

    const { getByTestId, getByText } = render(
      <ConnectionTrustSignalGate {...defaultProps} origin="https://x.com">
        <div>Child content</div>
      </ConnectionTrustSignalGate>,
    );

    expect(getByTestId('trust-signal-block-modal')).toBeInTheDocument();
    expect(getByText('xDappConnectionWarning')).toBeInTheDocument();
  });

  it('renders X.com warning modal for x.com subdomain', () => {
    mockUseOriginTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });

    const { getByTestId } = render(
      <ConnectionTrustSignalGate {...defaultProps} origin="https://www.x.com">
        <div>Child content</div>
      </ConnectionTrustSignalGate>,
    );

    expect(getByTestId('trust-signal-block-modal')).toBeInTheDocument();
  });

  it('renders X.com warning modal for mobile.x.com subdomain', () => {
    mockUseOriginTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });

    const { getByTestId } = render(
      <ConnectionTrustSignalGate
        {...defaultProps}
        origin="https://mobile.x.com"
      >
        <div>Child content</div>
      </ConnectionTrustSignalGate>,
    );

    expect(getByTestId('trust-signal-block-modal')).toBeInTheDocument();
  });

  it('hides X.com warning modal after clicking Continue Anyway', () => {
    mockUseOriginTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });

    const { getByTestId, queryByTestId } = render(
      <ConnectionTrustSignalGate {...defaultProps} origin="https://x.com">
        <div>Child content</div>
      </ConnectionTrustSignalGate>,
    );

    fireEvent.click(getByTestId('trust-signal-block-modal-continue'));
    expect(queryByTestId('trust-signal-block-modal')).not.toBeInTheDocument();
  });

  it('calls onCancel when Back to Safety is clicked in X.com warning', () => {
    mockUseOriginTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });

    const onCancel = jest.fn();

    const { getByTestId } = render(
      <ConnectionTrustSignalGate
        {...defaultProps}
        origin="https://x.com"
        onCancel={onCancel}
      >
        <div>Child content</div>
      </ConnectionTrustSignalGate>,
    );

    fireEvent.click(getByTestId('trust-signal-block-modal-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows malicious warning when both malicious and x.com', () => {
    mockUseOriginTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Malicious,
      label: null,
    });

    const { getByText } = render(
      <ConnectionTrustSignalGate {...defaultProps} origin="https://x.com">
        <div>Child content</div>
      </ConnectionTrustSignalGate>,
    );

    expect(getByText('continueAtYourOwnRisk')).toBeInTheDocument();
    expect(getByText('trustSignalPhishingWarning')).toBeInTheDocument();
  });
});
