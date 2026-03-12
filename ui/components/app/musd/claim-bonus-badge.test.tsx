/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { ClaimBonusBadge } from './claim-bonus-badge';

const mockClaimRewards = jest.fn();
const mockUseMerklClaim = jest.fn().mockReturnValue({
  claimRewards: mockClaimRewards,
  isClaiming: false,
  error: null,
});

const mockUseOnMerklClaimConfirmed = jest.fn();
const mockSetMerklClaimModalShown = jest.fn().mockResolvedValue(undefined);

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

jest.mock('../../../store/actions', () => ({
  setMerklClaimModalShown: () => () => mockSetMerklClaimModalShown(),
}));

const middleware = [thunk];
const mockStore = configureMockStore(middleware);

const defaultProps = {
  label: 'Claim 5% bonus',
  tokenAddress: '0xabc123',
  chainId: '0x1' as const,
  refetchRewards: jest.fn(),
};

const renderWithProvider = (
  component: React.ReactElement,
  { merklClaimModalShown = true } = {},
) => {
  const store = mockStore({
    metamask: {
      merklClaimModalShown,
    },
  });
  return render(<Provider store={store}>{component}</Provider>);
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
    renderWithProvider(<ClaimBonusBadge {...defaultProps} />);

    expect(screen.getByTestId('claim-bonus-badge')).toHaveTextContent(
      'Claim 5% bonus',
    );
  });

  it('calls claimRewards directly when modal has been shown before', () => {
    renderWithProvider(<ClaimBonusBadge {...defaultProps} />, {
      merklClaimModalShown: true,
    });

    const button = screen.getByRole('button');
    const stopPropagation = jest.fn();
    fireEvent.click(button, { stopPropagation });

    expect(mockClaimRewards).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('merkl-claim-modal')).not.toBeInTheDocument();
  });

  it('shows modal when modal has not been shown before', () => {
    renderWithProvider(<ClaimBonusBadge {...defaultProps} />, {
      merklClaimModalShown: false,
    });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockClaimRewards).not.toHaveBeenCalled();
    expect(screen.getByTestId('merkl-claim-modal')).toBeInTheDocument();
  });

  it('calls claimRewards after continuing from modal', async () => {
    renderWithProvider(<ClaimBonusBadge {...defaultProps} />, {
      merklClaimModalShown: false,
    });

    // Click to open modal
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('merkl-claim-modal')).toBeInTheDocument();

    // Click continue in modal
    fireEvent.click(screen.getByTestId('merkl-claim-modal-continue-button'));

    await waitFor(() => {
      expect(mockSetMerklClaimModalShown).toHaveBeenCalled();
      expect(mockClaimRewards).toHaveBeenCalled();
    });
  });

  it('renders spinner when isClaiming is true', () => {
    mockUseMerklClaim.mockReturnValue({
      claimRewards: mockClaimRewards,
      isClaiming: true,
      error: null,
    });

    renderWithProvider(<ClaimBonusBadge {...defaultProps} />);

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

    renderWithProvider(<ClaimBonusBadge {...defaultProps} />);

    expect(screen.getByTestId('claim-bonus-error')).toHaveTextContent(
      'merklRewardsUnexpectedError',
    );
    expect(screen.queryByTestId('claim-bonus-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('claim-bonus-spinner')).not.toBeInTheDocument();
  });

  it('passes refetchRewards to useOnMerklClaimConfirmed', () => {
    renderWithProvider(<ClaimBonusBadge {...defaultProps} />);

    expect(mockUseOnMerklClaimConfirmed).toHaveBeenCalledWith(
      defaultProps.refetchRewards,
    );
  });

  it('passes tokenAddress and chainId to useMerklClaim', () => {
    renderWithProvider(<ClaimBonusBadge {...defaultProps} />);

    expect(mockUseMerklClaim).toHaveBeenCalledWith({
      tokenAddress: '0xabc123',
      chainId: '0x1',
    });
  });
});
