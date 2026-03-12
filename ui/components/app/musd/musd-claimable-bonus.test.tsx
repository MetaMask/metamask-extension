import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Hex } from '@metamask/utils';
import { MusdClaimableBonus } from './musd-claimable-bonus';
import { useMerklRewards } from './hooks/useMerklRewards';
import { useMerklClaim } from './hooks/useMerklClaim';
import { useOnMerklClaimConfirmed } from './hooks/useOnMerklClaimConfirmed';

jest.mock('./hooks/useMerklRewards');
jest.mock('./hooks/useMerklClaim');
jest.mock('./hooks/useOnMerklClaimConfirmed');
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, args?: string[]) => {
    if (key === 'musdClaimableBonus') {
      return 'Claimable bonus';
    }
    if (key === 'merklClaimableBonusSubtitle') {
      return `${args?.[0]}% bonus on Linea`;
    }
    if (key === 'merklClaimButton') {
      return 'Claim';
    }
    if (key === 'merklRewardsToastInProgress') {
      return 'Processing...';
    }
    if (key === 'merklRewardsUnexpectedError') {
      return 'Unexpected error. Please try again.';
    }
    if (key === 'musdClaimableBonusTooltip') {
      return 'Tooltip text';
    }
    if (key === 'musdTermsApply') {
      return 'Terms apply.';
    }
    return key;
  },
}));

const mockUseMerklRewards = useMerklRewards as jest.MockedFunction<
  typeof useMerklRewards
>;
const mockUseMerklClaim = useMerklClaim as jest.MockedFunction<
  typeof useMerklClaim
>;
const mockUseOnMerklClaimConfirmed =
  useOnMerklClaimConfirmed as jest.MockedFunction<
    typeof useOnMerklClaimConfirmed
  >;

const TOKEN_ADDRESS = '0xacA92E438df0B2401fF60dA7E4337B687a2435DA';
const CHAIN_ID = '0x1' as Hex;

describe('MusdClaimableBonus', () => {
  const mockClaimRewards = jest.fn();
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOnMerklClaimConfirmed.mockImplementation(() => undefined);
    mockUseMerklClaim.mockReturnValue({
      claimRewards: mockClaimRewards,
      isClaiming: false,
      error: null,
    });
  });

  it('renders nothing when not eligible', () => {
    mockUseMerklRewards.mockReturnValue({
      isEligible: false,
      hasClaimableReward: false,
      rewardAmountFiat: null,
      refetch: mockRefetch,
    });

    const { container } = render(
      <MusdClaimableBonus tokenAddress={TOKEN_ADDRESS} chainId={CHAIN_ID} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when eligible but no claimable reward', () => {
    mockUseMerklRewards.mockReturnValue({
      isEligible: true,
      hasClaimableReward: false,
      rewardAmountFiat: null,
      refetch: mockRefetch,
    });

    const { container } = render(
      <MusdClaimableBonus tokenAddress={TOKEN_ADDRESS} chainId={CHAIN_ID} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders the claimable bonus section when eligible with reward', () => {
    mockUseMerklRewards.mockReturnValue({
      isEligible: true,
      hasClaimableReward: true,
      rewardAmountFiat: 10.01,
      refetch: mockRefetch,
    });

    render(
      <MusdClaimableBonus tokenAddress={TOKEN_ADDRESS} chainId={CHAIN_ID} />,
    );

    expect(screen.getByTestId('musd-claimable-bonus')).toBeInTheDocument();
    expect(screen.getByText('Claimable bonus')).toBeInTheDocument();
    expect(screen.getByText('3% bonus on Linea')).toBeInTheDocument();
    expect(screen.getByText('$10.01')).toBeInTheDocument();
    expect(
      screen.getByTestId('musd-claimable-bonus-claim-button'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('musd-claimable-bonus-claim-button'),
    ).toHaveTextContent('Claim');
  });

  it('calls claimRewards when claim button is clicked', () => {
    mockUseMerklRewards.mockReturnValue({
      isEligible: true,
      hasClaimableReward: true,
      rewardAmountFiat: 5.0,
      refetch: mockRefetch,
    });

    render(
      <MusdClaimableBonus tokenAddress={TOKEN_ADDRESS} chainId={CHAIN_ID} />,
    );

    fireEvent.click(screen.getByTestId('musd-claimable-bonus-claim-button'));
    expect(mockClaimRewards).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on button when claiming', () => {
    mockUseMerklRewards.mockReturnValue({
      isEligible: true,
      hasClaimableReward: true,
      rewardAmountFiat: 5.0,
      refetch: mockRefetch,
    });
    mockUseMerklClaim.mockReturnValue({
      claimRewards: mockClaimRewards,
      isClaiming: true,
      error: null,
    });

    render(
      <MusdClaimableBonus tokenAddress={TOKEN_ADDRESS} chainId={CHAIN_ID} />,
    );

    expect(
      screen.getByTestId('musd-claimable-bonus-claim-button'),
    ).toBeInTheDocument();
  });

  it('shows error message when claim fails', () => {
    mockUseMerklRewards.mockReturnValue({
      isEligible: true,
      hasClaimableReward: true,
      rewardAmountFiat: 5.0,
      refetch: mockRefetch,
    });
    mockUseMerklClaim.mockReturnValue({
      claimRewards: mockClaimRewards,
      isClaiming: false,
      error: 'Something went wrong',
    });

    render(
      <MusdClaimableBonus tokenAddress={TOKEN_ADDRESS} chainId={CHAIN_ID} />,
    );

    expect(
      screen.getByTestId('musd-claimable-bonus-error'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Unexpected error. Please try again.'),
    ).toBeInTheDocument();
  });

  it('does not show fiat amount when rewardAmountFiat is null', () => {
    mockUseMerklRewards.mockReturnValue({
      isEligible: true,
      hasClaimableReward: true,
      rewardAmountFiat: null,
      refetch: mockRefetch,
    });

    render(
      <MusdClaimableBonus tokenAddress={TOKEN_ADDRESS} chainId={CHAIN_ID} />,
    );

    expect(screen.getByText('Claimable bonus')).toBeInTheDocument();
    expect(screen.queryByText(/\$/u)).toBeNull();
  });

  it('registers claim confirmation watcher with refetch', () => {
    mockUseMerklRewards.mockReturnValue({
      isEligible: true,
      hasClaimableReward: true,
      rewardAmountFiat: 5.0,
      refetch: mockRefetch,
    });

    render(
      <MusdClaimableBonus tokenAddress={TOKEN_ADDRESS} chainId={CHAIN_ID} />,
    );

    expect(mockUseOnMerklClaimConfirmed).toHaveBeenCalledWith(mockRefetch);
  });
});
