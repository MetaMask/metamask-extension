/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MerklClaimToast } from './merkl-claim-toast';

const mockDismissToast = jest.fn();
const mockUseMerklClaimStatus = jest.fn();

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => {
    const translations: Record<string, string> = {
      merklRewardsToastInProgress: 'Claiming rewards...',
      merklRewardsToastSuccess: 'Rewards claimed!',
      merklRewardsToastFailed: 'Claim failed.',
    };
    return translations[key] ?? key;
  },
}));

jest.mock('../../../hooks/musd/useMerklClaimStatus', () => ({
  useMerklClaimStatus: () => mockUseMerklClaimStatus(),
}));

let capturedToastProps: Record<string, unknown> | null = null;
jest.mock('../../multichain/toast', () => ({
  Toast: (props: Record<string, unknown>) => {
    capturedToastProps = props;
    return (
      <div data-testid={props.dataTestId as string}>{props.text as string}</div>
    );
  },
}));

describe('MerklClaimToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedToastProps = null;
  });

  it('renders nothing when toastState is null', () => {
    mockUseMerklClaimStatus.mockReturnValue({
      toastState: null,
      dismissToast: mockDismissToast,
    });

    const { container } = render(<MerklClaimToast />);

    expect(container.innerHTML).toBe('');
  });

  it('renders in-progress toast without autoHide', () => {
    mockUseMerklClaimStatus.mockReturnValue({
      toastState: 'in-progress',
      dismissToast: mockDismissToast,
    });

    render(<MerklClaimToast />);

    expect(screen.getByTestId('merkl-claim-toast')).toHaveTextContent(
      'Claiming rewards...',
    );
    expect(capturedToastProps).not.toHaveProperty('autoHideTime');
    expect(capturedToastProps).not.toHaveProperty('onAutoHideToast');
  });

  it('renders success toast with autoHide', () => {
    mockUseMerklClaimStatus.mockReturnValue({
      toastState: 'success',
      dismissToast: mockDismissToast,
    });

    render(<MerklClaimToast />);

    expect(screen.getByTestId('merkl-claim-toast')).toHaveTextContent(
      'Rewards claimed!',
    );
    expect(capturedToastProps).toHaveProperty('autoHideTime', 5000);
    expect(capturedToastProps).toHaveProperty(
      'onAutoHideToast',
      mockDismissToast,
    );
  });

  it('renders failed toast with autoHide', () => {
    mockUseMerklClaimStatus.mockReturnValue({
      toastState: 'failed',
      dismissToast: mockDismissToast,
    });

    render(<MerklClaimToast />);

    expect(screen.getByTestId('merkl-claim-toast')).toHaveTextContent(
      'Claim failed.',
    );
    expect(capturedToastProps).toHaveProperty('autoHideTime', 5000);
    expect(capturedToastProps).toHaveProperty(
      'onAutoHideToast',
      mockDismissToast,
    );
  });

  it('passes dismissToast as onClose', () => {
    mockUseMerklClaimStatus.mockReturnValue({
      toastState: 'success',
      dismissToast: mockDismissToast,
    });

    render(<MerklClaimToast />);

    expect(capturedToastProps).toHaveProperty('onClose', mockDismissToast);
  });
});
