/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
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

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn().mockReturnValue({
    '0x1': { name: 'Ethereum Mainnet' },
  }),
}));

jest.mock('../../../contexts/metametrics', () => {
  const ReactActual = jest.requireActual<typeof import('react')>('react');
  const _trackEvent = jest.fn();
  const MetaMetricsContext = ReactActual.createContext({
    trackEvent: _trackEvent,
    bufferedTrace: jest.fn().mockResolvedValue(undefined),
    bufferedEndTrace: jest.fn().mockResolvedValue(undefined),
    onboardingParentContext: { current: null },
  });
  MetaMetricsContext.Provider = (({
    children,
  }: {
    children: React.ReactNode;
  }) =>
    ReactActual.createElement(
      ReactActual.Fragment,
      null,
      children,
    )) as unknown as typeof MetaMetricsContext.Provider;
  return {
    MetaMetricsContext,
    LegacyMetaMetricsProvider: ({ children }: { children: React.ReactNode }) =>
      ReactActual.createElement(ReactActual.Fragment, null, children),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __mockTrackEvent: _trackEvent,
  };
});
const { __mockTrackEvent: mockTrackEvent } = jest.requireMock<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __mockTrackEvent: jest.Mock;
}>('../../../contexts/metametrics');

const defaultProps = {
  label: 'Claim 5% bonus',
  tokenAddress: '0xabc123',
  chainId: '0x1' as const,
  refetchRewards: jest.fn(),
  location: 'token_list_item' as const,
  assetSymbol: 'MUSD',
  bonusAmountRange: '10.00 - 99.99',
  hasClaimedBefore: false,
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

  it('fires MusdClaimBonusCtaDisplayed once when the claim button is shown', () => {
    render(<ClaimBonusBadge {...defaultProps} />);

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    /* eslint-disable @typescript-eslint/naming-convention */
    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: MetaMetricsEventName.MusdClaimBonusCtaDisplayed,
      category: MetaMetricsEventCategory.MusdConversion,
      properties: {
        location: 'token_list_item',
        view_trigger: 'component_mounted',
        button_text: 'Claim 5% bonus',
        network_chain_id: '0x1',
        network_name: 'Ethereum Mainnet',
        asset_symbol: 'MUSD',
        bonus_amount_range: '10.00 - 99.99',
        has_claimed_before: false,
      },
    });
    /* eslint-enable @typescript-eslint/naming-convention */
  });

  it('does not fire MusdClaimBonusCtaDisplayed when showing spinner', () => {
    mockUseMerklClaim.mockReturnValue({
      claimRewards: mockClaimRewards,
      isClaiming: true,
      error: null,
    });

    render(<ClaimBonusBadge {...defaultProps} />);

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('does not fire MusdClaimBonusCtaDisplayed when showing error', () => {
    mockUseMerklClaim.mockReturnValue({
      claimRewards: mockClaimRewards,
      isClaiming: false,
      error: 'Something went wrong',
    });

    render(<ClaimBonusBadge {...defaultProps} />);

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('calls claimRewards and stopPropagation on click', () => {
    render(<ClaimBonusBadge {...defaultProps} />);

    const button = screen.getByRole('button');
    const stopPropagation = jest.fn();
    fireEvent.click(button, { stopPropagation });

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
