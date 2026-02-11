import React from 'react';
import { render } from '@testing-library/react';
import MerklRewards from './merkl-rewards';
import {
  isEligibleForMerklRewards,
  useMerklRewards,
} from './hooks/useMerklRewards';
import { usePendingMerklClaim } from './hooks/usePendingMerklClaim';

jest.mock('./hooks/useMerklRewards');
jest.mock('./hooks/usePendingMerklClaim');

jest.mock('./pending-merkl-rewards', () => {
  const MockReact = jest.requireActual('react');
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: ({ claimableReward }: { claimableReward: string | null }) =>
      MockReact.createElement('div', {
        'data-testid': 'pending-merkl-rewards',
        'data-claimable': claimableReward,
      }),
  };
});

jest.mock('./claim-merkl-rewards', () => {
  const MockReact = jest.requireActual('react');
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: ({ tokenAddress }: { tokenAddress: string; chainId: string }) =>
      MockReact.createElement('div', {
        'data-testid': 'claim-merkl-rewards',
        'data-token': tokenAddress,
      }),
  };
});

const mockIsEligibleForMerklRewards =
  isEligibleForMerklRewards as jest.MockedFunction<
    typeof isEligibleForMerklRewards
  >;
const mockUseMerklRewards = useMerklRewards as jest.MockedFunction<
  typeof useMerklRewards
>;
const mockUsePendingMerklClaim = usePendingMerklClaim as jest.MockedFunction<
  typeof usePendingMerklClaim
>;

const createMockUseMerklRewardsReturn = (
  claimableReward: string | null,
  isFeatureEnabled = true,
): ReturnType<typeof useMerklRewards> => ({
  claimableReward,
  isFeatureEnabled,
  refetch: jest.fn(),
});

const MOCK_TOKEN_ADDRESS = '0xacA92E438df0B2401fF60dA7E4337B687a2435DA';
const MOCK_CHAIN_ID = '0x1' as `0x${string}`;

describe('MerklRewards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePendingMerklClaim.mockReturnValue({ hasPendingClaim: false });
  });

  it('returns null when asset is not eligible', () => {
    mockIsEligibleForMerklRewards.mockReturnValue(false);
    mockUseMerklRewards.mockReturnValue(createMockUseMerklRewardsReturn(null));

    const { queryByTestId } = render(
      <MerklRewards
        tokenAddress={MOCK_TOKEN_ADDRESS}
        chainId={MOCK_CHAIN_ID}
      />,
    );

    expect(queryByTestId('pending-merkl-rewards')).toBeNull();
  });

  it('returns null when feature is disabled', () => {
    mockIsEligibleForMerklRewards.mockReturnValue(true);
    mockUseMerklRewards.mockReturnValue(
      createMockUseMerklRewardsReturn(null, false),
    );

    const { queryByTestId } = render(
      <MerklRewards
        tokenAddress={MOCK_TOKEN_ADDRESS}
        chainId={MOCK_CHAIN_ID}
      />,
    );

    expect(queryByTestId('pending-merkl-rewards')).toBeNull();
  });

  it('renders nothing when eligible but claimableReward is null (loading)', () => {
    mockIsEligibleForMerklRewards.mockReturnValue(true);
    mockUseMerklRewards.mockReturnValue(createMockUseMerklRewardsReturn(null));

    const { queryByTestId } = render(
      <MerklRewards
        tokenAddress={MOCK_TOKEN_ADDRESS}
        chainId={MOCK_CHAIN_ID}
      />,
    );

    // Nothing renders until claimableReward is available (avoids flash of empty separator)
    expect(queryByTestId('pending-merkl-rewards')).toBeNull();
    expect(queryByTestId('claim-merkl-rewards')).toBeNull();
  });

  it('renders PendingMerklRewards and ClaimMerklRewards when claimableReward is present', () => {
    mockIsEligibleForMerklRewards.mockReturnValue(true);
    mockUseMerklRewards.mockReturnValue(
      createMockUseMerklRewardsReturn('1.50'),
    );

    const { getByTestId } = render(
      <MerklRewards
        tokenAddress={MOCK_TOKEN_ADDRESS}
        chainId={MOCK_CHAIN_ID}
      />,
    );

    expect(getByTestId('pending-merkl-rewards')).toBeDefined();
    expect(getByTestId('claim-merkl-rewards')).toBeDefined();
  });

  it('passes correct props to useMerklRewards hook', () => {
    mockIsEligibleForMerklRewards.mockReturnValue(true);
    mockUseMerklRewards.mockReturnValue(createMockUseMerklRewardsReturn(null));

    render(
      <MerklRewards
        tokenAddress={MOCK_TOKEN_ADDRESS}
        chainId={MOCK_CHAIN_ID}
      />,
    );

    expect(mockUseMerklRewards).toHaveBeenCalledWith({
      tokenAddress: MOCK_TOKEN_ADDRESS,
      chainId: MOCK_CHAIN_ID,
    });
  });

  it('passes claimableReward to PendingMerklRewards', () => {
    mockIsEligibleForMerklRewards.mockReturnValue(true);
    mockUseMerklRewards.mockReturnValue(
      createMockUseMerklRewardsReturn('2.50'),
    );

    const { getByTestId } = render(
      <MerklRewards
        tokenAddress={MOCK_TOKEN_ADDRESS}
        chainId={MOCK_CHAIN_ID}
      />,
    );

    const pendingRewards = getByTestId('pending-merkl-rewards');
    expect(pendingRewards.getAttribute('data-claimable')).toBe('2.50');
  });

  it('calls refetch when onClaimConfirmed is triggered', () => {
    const mockRefetch = jest.fn();
    mockIsEligibleForMerklRewards.mockReturnValue(true);
    mockUseMerklRewards.mockReturnValue({
      claimableReward: '1.50',
      isFeatureEnabled: true,
      refetch: mockRefetch,
    });

    // Capture the onClaimConfirmed callback
    let capturedOnClaimConfirmed: (() => void) | undefined;
    mockUsePendingMerklClaim.mockImplementation((options) => {
      capturedOnClaimConfirmed = options?.onClaimConfirmed;
      return { hasPendingClaim: false };
    });

    render(
      <MerklRewards
        tokenAddress={MOCK_TOKEN_ADDRESS}
        chainId={MOCK_CHAIN_ID}
      />,
    );

    expect(capturedOnClaimConfirmed).toBeDefined();
    capturedOnClaimConfirmed?.();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

});
