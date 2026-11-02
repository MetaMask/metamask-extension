import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { XDappConnectionGate } from './x-dapp-connection-gate';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

describe('XDappConnectionGate', () => {
  const defaultProps = {
    origin: 'https://example.com',
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children without modal for non-X.com origin', () => {
    const { getByText, queryByTestId } = render(
      <XDappConnectionGate {...defaultProps}>
        <div>Child content</div>
      </XDappConnectionGate>,
    );

    expect(getByText('Child content')).toBeInTheDocument();
    expect(queryByTestId('x-dapp-warning-modal')).not.toBeInTheDocument();
  });

  it('renders modal for x.com origin', () => {
    const { getByTestId, getByText } = render(
      <XDappConnectionGate {...defaultProps} origin="https://x.com">
        <div>Child content</div>
      </XDappConnectionGate>,
    );

    expect(getByTestId('x-dapp-warning-modal')).toBeInTheDocument();
    expect(getByText('Child content')).toBeInTheDocument();
  });

  it('renders modal for x.com subdomain', () => {
    const { getByTestId } = render(
      <XDappConnectionGate {...defaultProps} origin="https://www.x.com">
        <div>Child content</div>
      </XDappConnectionGate>,
    );

    expect(getByTestId('x-dapp-warning-modal')).toBeInTheDocument();
  });

  it('renders modal for mobile.x.com subdomain', () => {
    const { getByTestId } = render(
      <XDappConnectionGate {...defaultProps} origin="https://mobile.x.com">
        <div>Child content</div>
      </XDappConnectionGate>,
    );

    expect(getByTestId('x-dapp-warning-modal')).toBeInTheDocument();
  });

  it('hides modal after clicking Continue Anyway', () => {
    const { getByTestId, queryByTestId } = render(
      <XDappConnectionGate {...defaultProps} origin="https://x.com">
        <div>Child content</div>
      </XDappConnectionGate>,
    );

    fireEvent.click(getByTestId('x-dapp-warning-modal-continue'));
    expect(queryByTestId('x-dapp-warning-modal')).not.toBeInTheDocument();
  });

  it('calls onCancel when Back to Safety is clicked', () => {
    const onCancel = jest.fn();

    const { getByTestId } = render(
      <XDappConnectionGate
        {...defaultProps}
        origin="https://x.com"
        onCancel={onCancel}
      >
        <div>Child content</div>
      </XDappConnectionGate>,
    );

    fireEvent.click(getByTestId('x-dapp-warning-modal-back'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
