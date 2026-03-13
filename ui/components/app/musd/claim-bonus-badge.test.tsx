/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { ClaimBonusBadge } from './claim-bonus-badge';

const mockClaimRewards = jest.fn();
const mockUseMerklClaim = jest.fn().mockReturnValue({
  claimRewards: mockClaimRewards,
  isClaiming: false,
  error: null,
});

const mockUseOnMerklClaimConfirmed = jest.fn();

jest.mock('./hooks/useMerklClaim', () => ({
  useMerklClaim: (...args: unknown[]) => mockUseMerklClaim(...args),
}));

jest.mock('./hooks/useOnMerklClaimConfirmed', () => ({
  useOnMerklClaimConfirmed: (...args: unknown[]) =>
    mockUseOnMerklClaimConfirmed(...args),
}));

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

const defaultProps = {
  label: 'Claim 5% bonus',
  tokenAddress: '0xabc123',
  chainId: '0x1' as const,
  refetchRewards: jest.fn(),
};

describe('ClaimBonusBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMerklClaim.mockReturnValue({
      claimRewards: mockClaimRewards,
      isClaiming: false,
      error: null,
    });
  });

  it('renders label text in the badge button', () => {
    render(<ClaimBonusBadge {...defaultProps} />);

    expect(screen.getByTestId('claim-bonus-badge')).toHaveTextContent(
      'Claim 5% bonus',
    );
  });

  it('calls claimRewards when badge is clicked', () => {
    render(<ClaimBonusBadge {...defaultProps} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockClaimRewards).toHaveBeenCalledTimes(1);
  });

  it('renders spinner when isClaiming is true', () => {
    mockUseMerklClaim.mockReturnValue({
      claimRewards: mockClaimRewards,
      isClaiming: true,
      error: null,
    });

    render(<ClaimBonusBadge {...defaultProps} />);

    expect(screen.getByTestId('claim-bonus-spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('claim-bonus-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('claim-bonus-error')).not.toBeInTheDocument();
  });

  it('renders error message when error is set', () => {
    mockUseMerklClaim.mockReturnValue({
      claimRewards: mockClaimRewards,
      isClaiming: false,
      error: 'Something went wrong',
    });

    render(<ClaimBonusBadge {...defaultProps} />);

    expect(screen.getByTestId('claim-bonus-error')).toHaveTextContent(
      'merklRewardsUnexpectedError',
    );
    expect(screen.queryByTestId('claim-bonus-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('claim-bonus-spinner')).not.toBeInTheDocument();
  });

  it('passes refetchRewards to useOnMerklClaimConfirmed', () => {
    render(<ClaimBonusBadge {...defaultProps} />);

    expect(mockUseOnMerklClaimConfirmed).toHaveBeenCalledWith(
      defaultProps.refetchRewards,
    );
  });

  it('passes tokenAddress and chainId to useMerklClaim', () => {
    render(<ClaimBonusBadge {...defaultProps} />);

    expect(mockUseMerklClaim).toHaveBeenCalledWith({
      tokenAddress: '0xabc123',
      chainId: '0x1',
    });
  });
});
