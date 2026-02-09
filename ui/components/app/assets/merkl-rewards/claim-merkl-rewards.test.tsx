import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import ClaimMerklRewards from './claim-merkl-rewards';
import { useMerklClaim } from './hooks/useMerklClaim';
import { usePendingMerklClaim } from './hooks/usePendingMerklClaim';

jest.mock('./hooks/useMerklClaim');
jest.mock('./hooks/usePendingMerklClaim');

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => {
    const messages: Record<string, string> = {
      merklRewardsClaim: 'Claim',
      merklRewardsClaimOnLineaTitle: 'Claim bonuses on Linea',
      merklRewardsClaimOnLineaDescription:
        'Your bonus will be issued on Linea, separate from your Ethereum mUSD balance.',
      merklRewardsTermsApply: 'Terms apply.',
      merklRewardsContinue: 'Continue',
      merklRewardsUnexpectedError: 'Unexpected error. Please try again.',
    };
    return messages[key] ?? key;
  },
}));

// Mock global.platform.openTab
const mockOpenTab = jest.fn();
(global as Record<string, unknown>).platform = { openTab: mockOpenTab };

const mockUseMerklClaim = useMerklClaim as jest.MockedFunction<
  typeof useMerklClaim
>;
const mockUsePendingMerklClaim = usePendingMerklClaim as jest.MockedFunction<
  typeof usePendingMerklClaim
>;

const MOCK_TOKEN_ADDRESS = '0xacA92E438df0B2401fF60dA7E4337B687a2435DA';
const MOCK_CHAIN_ID = '0x1' as `0x${string}`;

describe('ClaimMerklRewards', () => {
  const mockClaimRewards = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseMerklClaim.mockReturnValue({
      claimRewards: mockClaimRewards,
      isClaiming: false,
      error: null,
    });

    mockUsePendingMerklClaim.mockReturnValue({
      hasPendingClaim: false,
    });
  });

  it('renders the claim button', () => {
    const { getByTestId } = render(
      <ClaimMerklRewards
        tokenAddress={MOCK_TOKEN_ADDRESS}
        chainId={MOCK_CHAIN_ID}
      />,
    );

    expect(getByTestId('claim-merkl-rewards-button')).toBeDefined();
    expect(getByTestId('claim-merkl-rewards-button').textContent).toBe('Claim');
  });

  it('opens modal when claim button is clicked', () => {
    const { getByTestId, getByText } = render(
      <ClaimMerklRewards
        tokenAddress={MOCK_TOKEN_ADDRESS}
        chainId={MOCK_CHAIN_ID}
      />,
    );

    fireEvent.click(getByTestId('claim-merkl-rewards-button'));

    expect(getByText('Claim bonuses on Linea')).toBeDefined();
    expect(getByText(/Your bonus will be issued on Linea/u)).toBeDefined();
  });

  it('calls claimRewards when continue is clicked', async () => {
    mockClaimRewards.mockResolvedValueOnce(undefined);

    const { getByTestId } = render(
      <ClaimMerklRewards
        tokenAddress={MOCK_TOKEN_ADDRESS}
        chainId={MOCK_CHAIN_ID}
      />,
    );

    // Open modal
    fireEvent.click(getByTestId('claim-merkl-rewards-button'));

    // Click continue
    fireEvent.click(getByTestId('claim-on-linea-continue-button'));

    await waitFor(() => {
      expect(mockClaimRewards).toHaveBeenCalledTimes(1);
    });
  });

  it('disables button when isClaiming is true', () => {
    mockUseMerklClaim.mockReturnValue({
      claimRewards: mockClaimRewards,
      isClaiming: true,
      error: null,
    });

    const { getByTestId } = render(
      <ClaimMerklRewards
        tokenAddress={MOCK_TOKEN_ADDRESS}
        chainId={MOCK_CHAIN_ID}
      />,
    );

    expect(getByTestId('claim-merkl-rewards-button')).toBeDisabled();
  });

  it('disables button when hasPendingClaim is true', () => {
    mockUsePendingMerklClaim.mockReturnValue({
      hasPendingClaim: true,
    });

    const { getByTestId } = render(
      <ClaimMerklRewards
        tokenAddress={MOCK_TOKEN_ADDRESS}
        chainId={MOCK_CHAIN_ID}
      />,
    );

    expect(getByTestId('claim-merkl-rewards-button')).toBeDisabled();
  });

  it('shows error message when claimError is set', () => {
    mockUseMerklClaim.mockReturnValue({
      claimRewards: mockClaimRewards,
      isClaiming: false,
      error: 'Something went wrong',
    });

    const { getByTestId } = render(
      <ClaimMerklRewards
        tokenAddress={MOCK_TOKEN_ADDRESS}
        chainId={MOCK_CHAIN_ID}
      />,
    );

    expect(getByTestId('claim-merkl-rewards-error')).toBeDefined();
    expect(getByTestId('claim-merkl-rewards-error').textContent).toBe(
      'Unexpected error. Please try again.',
    );
  });

  it('does not show error when claimError is null', () => {
    const { queryByTestId } = render(
      <ClaimMerklRewards
        tokenAddress={MOCK_TOKEN_ADDRESS}
        chainId={MOCK_CHAIN_ID}
      />,
    );

    expect(queryByTestId('claim-merkl-rewards-error')).toBeNull();
  });

  it('opens terms link in new tab', () => {
    const { getByTestId } = render(
      <ClaimMerklRewards
        tokenAddress={MOCK_TOKEN_ADDRESS}
        chainId={MOCK_CHAIN_ID}
      />,
    );

    // Open modal first
    fireEvent.click(getByTestId('claim-merkl-rewards-button'));

    fireEvent.click(getByTestId('claim-on-linea-terms-link'));

    expect(mockOpenTab).toHaveBeenCalledWith({
      url: expect.stringContaining('consensys.io'),
    });
  });

  it('closes modal when handleModalClose is called', () => {
    const { getByTestId, queryByText } = render(
      <ClaimMerklRewards
        tokenAddress={MOCK_TOKEN_ADDRESS}
        chainId={MOCK_CHAIN_ID}
      />,
    );

    // Open modal
    fireEvent.click(getByTestId('claim-merkl-rewards-button'));
    expect(queryByText('Claim bonuses on Linea')).toBeDefined();

    // Click continue closes the modal
    fireEvent.click(getByTestId('claim-on-linea-continue-button'));

    // Modal should be gone (Continue button closes it before claiming)
    expect(queryByText('Claim bonuses on Linea')).toBeNull();
  });
});
