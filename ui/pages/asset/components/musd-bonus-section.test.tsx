/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { I18nContext } from '../../../contexts/i18n';
import { getMessage } from '../../../helpers/utils/i18n-helper';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { MUSD_TOKEN_ADDRESS } from '../../../components/app/musd/constants';
import { selectIsMerklClaimingEnabled } from '../../../selectors/musd';
import { MusdBonusSection } from './musd-bonus-section';

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

jest.mock('../../../selectors/multichain', () => ({
  getMultichainNetworkConfigurationsByChainId: jest.fn(() => ({
    '0x1': { name: 'Ethereum Mainnet' },
  })),
}));

const mockRefetchRewards = jest.fn();
const mockUseMerklRewards = jest.fn().mockReturnValue({
  hasClaimableReward: false,
  rewardAmountFiat: null,
  lifetimeClaimedFiat: 5,
  isLoading: false,
  isEligible: true,
  claimableRewardDisplay: null,
  hasClaimedBefore: false,
  refetch: mockRefetchRewards,
});

const mockClaimRewards = jest.fn();
const mockUseMerklClaim = jest.fn().mockReturnValue({
  claimRewards: mockClaimRewards,
  isClaiming: false,
  error: null,
});

let capturedOnConfirmed: (() => void) | null = null;
const mockUseOnMerklClaimConfirmed = jest.fn((cb: () => void) => {
  capturedOnConfirmed = cb;
  return { isClaimInFlight: false };
});

jest.mock('../../../hooks/musd/useMusdGeoBlocking', () => ({
  useMusdGeoBlocking: () => ({
    isBlocked: false,
    isLoading: false,
  }),
}));

jest.mock('../../../hooks/useFiatFormatter', () => ({
  useFiatFormatter: () => (n: number) => `$${n.toFixed(2)}`,
}));

jest.mock('../../../components/app/musd/hooks/useMerklRewards', () => ({
  useMerklRewards: (...args: unknown[]) => mockUseMerklRewards(...args),
}));

jest.mock('../../../components/app/musd/hooks/useMerklClaim', () => ({
  useMerklClaim: (...args: unknown[]) => mockUseMerklClaim(...args),
}));

jest.mock(
  '../../../components/app/musd/hooks/useOnMerklClaimConfirmed',
  () => ({
    useOnMerklClaimConfirmed: (cb: () => void) =>
      mockUseOnMerklClaimConfirmed(cb),
  }),
);

jest.mock('../../../selectors/musd', () => {
  const actual = jest.requireActual('../../../selectors/musd');
  return {
    ...actual,
    selectIsMusdConversionFlowEnabled: () => true,
    selectIsMerklClaimingEnabled: jest.fn(() => true),
  };
});

const store = configureMockStore()({});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const t = (key: string, ...args: any[]) =>
  getMessage('en', messages, key, ...args) ?? '';

const renderWithProviders = (component: React.ReactElement) =>
  render(
    <Provider store={store}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <I18nContext.Provider value={t as any}>{component}</I18nContext.Provider>
    </Provider>,
  );

describe('MusdBonusSection', () => {
  beforeEach(() => {
    (selectIsMerklClaimingEnabled as unknown as jest.Mock).mockReturnValue(
      true,
    );
    capturedOnConfirmed = null;
    mockUseOnMerklClaimConfirmed.mockImplementation((cb: () => void) => {
      capturedOnConfirmed = cb;
      return { isClaimInFlight: false };
    });
    mockRefetchRewards.mockClear();
    mockTrackEvent.mockClear();
    mockUseMerklRewards.mockReturnValue({
      hasClaimableReward: false,
      rewardAmountFiat: null,
      lifetimeClaimedFiat: 5,
      isLoading: false,
      isEligible: true,
      claimableRewardDisplay: null,
      hasClaimedBefore: false,
      refetch: mockRefetchRewards,
    });
    mockUseMerklClaim.mockReturnValue({
      claimRewards: mockClaimRewards,
      isClaiming: false,
      error: null,
    });
    mockClaimRewards.mockClear();
  });

  it('returns null when Merkl claiming is disabled', () => {
    (selectIsMerklClaimingEnabled as unknown as jest.Mock).mockReturnValue(
      false,
    );

    renderWithProviders(
      <MusdBonusSection
        chainId="0x1"
        tokenAddress={MUSD_TOKEN_ADDRESS}
        positionFiatValue={1000}
        showFiat
        hasPositiveBalance
      />,
    );

    expect(screen.queryByTestId('musd-bonus-section')).not.toBeInTheDocument();
  });

  it('renders section title and bonus rows', () => {
    renderWithProviders(
      <MusdBonusSection
        chainId="0x1"
        tokenAddress={MUSD_TOKEN_ADDRESS}
        positionFiatValue={1000}
        showFiat
        hasPositiveBalance
      />,
    );

    expect(screen.getByTestId('musd-bonus-section')).toBeInTheDocument();
    expect(
      screen.getByText(messages.musdAssetBonusTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.musdAssetBonusEstimatedAnnual.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.musdAssetBonusLifetimeClaimed.message),
    ).toBeInTheDocument();
  });

  it('renders Your bonus info control and opens tooltip content', async () => {
    renderWithProviders(
      <MusdBonusSection
        chainId="0x1"
        tokenAddress={MUSD_TOKEN_ADDRESS}
        positionFiatValue={1000}
        showFiat
        hasPositiveBalance
      />,
    );

    expect(
      screen.getByTestId('musd-bonus-info-tooltip-button'),
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('musd-bonus-info-tooltip-button'));
    });

    expect(
      screen.getByText(messages.musdAssetBonusInfoLearnMore.message),
    ).toBeInTheDocument();
  });

  describe('claim button states', () => {
    it('shows "Claim $X bonus" and is enabled when reward is claimable', () => {
      mockUseMerklRewards.mockReturnValue({
        hasClaimableReward: true,
        rewardAmountFiat: 10.27,
        lifetimeClaimedFiat: 5,
        isLoading: false,
        isEligible: true,
        claimableRewardDisplay: '10.27',
        hasClaimedBefore: false,
        refetch: mockRefetchRewards,
      });

      renderWithProviders(
        <MusdBonusSection
          chainId="0x1"
          tokenAddress={MUSD_TOKEN_ADDRESS}
          positionFiatValue={1000}
          showFiat
          hasPositiveBalance
        />,
      );

      const button = screen.getByTestId('musd-claim-bonus-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Claim $10.27 bonus');
      expect(button).not.toBeDisabled();
    });

    it('calls claimRewards when the claim button is clicked', () => {
      mockUseMerklRewards.mockReturnValue({
        hasClaimableReward: true,
        rewardAmountFiat: 5,
        lifetimeClaimedFiat: 0,
        isLoading: false,
        isEligible: true,
        claimableRewardDisplay: '5.00',
        hasClaimedBefore: false,
        refetch: mockRefetchRewards,
      });

      renderWithProviders(
        <MusdBonusSection
          chainId="0x1"
          tokenAddress={MUSD_TOKEN_ADDRESS}
          positionFiatValue={1000}
          showFiat
          hasPositiveBalance
        />,
      );

      fireEvent.click(screen.getByTestId('musd-claim-bonus-button'));
      expect(mockClaimRewards).toHaveBeenCalledTimes(1);
    });

    it('shows disabled "Accruing next bonus" when user has mUSD but no claimable reward', () => {
      mockUseMerklRewards.mockReturnValue({
        hasClaimableReward: false,
        rewardAmountFiat: null,
        lifetimeClaimedFiat: 0,
        isLoading: false,
        isEligible: true,
        claimableRewardDisplay: null,
        hasClaimedBefore: false,
        refetch: mockRefetchRewards,
      });

      renderWithProviders(
        <MusdBonusSection
          chainId="0x1"
          tokenAddress={MUSD_TOKEN_ADDRESS}
          positionFiatValue={1000}
          showFiat
          hasPositiveBalance
        />,
      );

      const button = screen.getByTestId('musd-claim-bonus-button');
      expect(button).toHaveTextContent(messages.musdAssetBonusAccruing.message);
      expect(button).toBeDisabled();
    });

    it('shows "Accruing next bonus" when fiat display is off but the user holds mUSD', () => {
      mockUseMerklRewards.mockReturnValue({
        hasClaimableReward: false,
        rewardAmountFiat: null,
        lifetimeClaimedFiat: 0,
        isLoading: false,
        isEligible: true,
        claimableRewardDisplay: null,
        hasClaimedBefore: false,
        refetch: mockRefetchRewards,
      });

      renderWithProviders(
        <MusdBonusSection
          chainId="0x1"
          tokenAddress={MUSD_TOKEN_ADDRESS}
          positionFiatValue={null}
          showFiat={false}
          hasPositiveBalance
        />,
      );

      const button = screen.getByTestId('musd-claim-bonus-button');
      expect(button).toHaveTextContent(messages.musdAssetBonusAccruing.message);
      expect(button).toBeDisabled();
    });

    it('shows disabled "No accruing bonus" when user has no mUSD and no claimable reward', () => {
      mockUseMerklRewards.mockReturnValue({
        hasClaimableReward: false,
        rewardAmountFiat: null,
        lifetimeClaimedFiat: 0,
        isLoading: false,
        isEligible: true,
        claimableRewardDisplay: null,
        hasClaimedBefore: false,
        refetch: mockRefetchRewards,
      });

      renderWithProviders(
        <MusdBonusSection
          chainId="0x1"
          tokenAddress={MUSD_TOKEN_ADDRESS}
          positionFiatValue={0}
          showFiat
          hasPositiveBalance={false}
        />,
      );

      const button = screen.getByTestId('musd-claim-bonus-button');
      expect(button).toHaveTextContent(
        messages.musdAssetBonusNoAccruing.message,
      );
      expect(button).toBeDisabled();
    });

    it('registers refetchRewards with useOnMerklClaimConfirmed on mount', () => {
      renderWithProviders(
        <MusdBonusSection
          chainId="0x1"
          tokenAddress={MUSD_TOKEN_ADDRESS}
          positionFiatValue={1000}
          showFiat
          hasPositiveBalance
        />,
      );

      expect(mockUseOnMerklClaimConfirmed).toHaveBeenCalledWith(
        mockRefetchRewards,
      );
    });

    it('calls refetchRewards when the claim confirmation callback fires', () => {
      renderWithProviders(
        <MusdBonusSection
          chainId="0x1"
          tokenAddress={MUSD_TOKEN_ADDRESS}
          positionFiatValue={1000}
          showFiat
          hasPositiveBalance
        />,
      );

      expect(capturedOnConfirmed).not.toBeNull();
      capturedOnConfirmed?.();
      expect(mockRefetchRewards).toHaveBeenCalledTimes(1);
    });

    it('disables the button and shows loading when claim is in progress', () => {
      mockUseMerklRewards.mockReturnValue({
        hasClaimableReward: true,
        rewardAmountFiat: 10,
        lifetimeClaimedFiat: 5,
        isLoading: false,
        isEligible: true,
        claimableRewardDisplay: '10.00',
        hasClaimedBefore: false,
        refetch: mockRefetchRewards,
      });
      mockUseMerklClaim.mockReturnValue({
        claimRewards: mockClaimRewards,
        isClaiming: true,
        error: null,
      });

      renderWithProviders(
        <MusdBonusSection
          chainId="0x1"
          tokenAddress={MUSD_TOKEN_ADDRESS}
          positionFiatValue={1000}
          showFiat
          hasPositiveBalance
        />,
      );

      const button = screen.getByTestId('musd-claim-bonus-button');
      expect(button).toBeDisabled();
    });

    it('disables the button when a claim transaction is in-flight after remount', () => {
      mockUseOnMerklClaimConfirmed.mockImplementation((cb: () => void) => {
        capturedOnConfirmed = cb;
        return { isClaimInFlight: true };
      });
      mockUseMerklRewards.mockReturnValue({
        hasClaimableReward: true,
        rewardAmountFiat: 5,
        lifetimeClaimedFiat: 0,
        isLoading: false,
        isEligible: true,
        claimableRewardDisplay: '5.00',
        hasClaimedBefore: false,
        refetch: mockRefetchRewards,
      });

      renderWithProviders(
        <MusdBonusSection
          chainId="0x1"
          tokenAddress={MUSD_TOKEN_ADDRESS}
          positionFiatValue={1000}
          showFiat
          hasPositiveBalance
        />,
      );

      const button = screen.getByTestId('musd-claim-bonus-button');
      expect(button).toBeDisabled();
    });
  });

  describe('Merkl claim analytics', () => {
    it('does not fire MusdClaimBonusCtaDisplayed when there is no claimable reward', () => {
      renderWithProviders(
        <MusdBonusSection
          chainId="0x1"
          tokenAddress={MUSD_TOKEN_ADDRESS}
          positionFiatValue={1000}
          showFiat
          hasPositiveBalance
        />,
      );

      expect(mockTrackEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({
          event: MetaMetricsEventName.MusdClaimBonusCtaDisplayed,
        }),
      );
    });

    it('fires MusdClaimBonusCtaDisplayed when claimable with location asset_overview and bonus_amount_range', () => {
      mockUseMerklRewards.mockReturnValue({
        hasClaimableReward: true,
        rewardAmountFiat: 10.27,
        lifetimeClaimedFiat: 5,
        isLoading: false,
        isEligible: true,
        claimableRewardDisplay: '10.27',
        hasClaimedBefore: false,
        refetch: mockRefetchRewards,
      });

      renderWithProviders(
        <MusdBonusSection
          chainId="0x1"
          tokenAddress={MUSD_TOKEN_ADDRESS}
          positionFiatValue={1000}
          showFiat
          hasPositiveBalance
        />,
      );

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: MetaMetricsEventName.MusdClaimBonusCtaDisplayed,
          properties: expect.objectContaining({
            location: 'asset_overview',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            view_trigger: 'component_mounted',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            network_chain_id: '0x1',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            network_name: 'Ethereum Mainnet',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            asset_symbol: messages.musdSymbol.message,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            bonus_amount_range: '10.00 - 99.99',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            has_claimed_before: false,
          }),
        }),
      );
    });

    it('does not fire MusdClaimBonusCtaDisplayed while claim is in progress', () => {
      mockUseMerklRewards.mockReturnValue({
        hasClaimableReward: true,
        rewardAmountFiat: 10,
        lifetimeClaimedFiat: 5,
        isLoading: false,
        isEligible: true,
        claimableRewardDisplay: '10.00',
        hasClaimedBefore: false,
        refetch: mockRefetchRewards,
      });
      mockUseMerklClaim.mockReturnValue({
        claimRewards: mockClaimRewards,
        isClaiming: true,
        error: null,
      });

      renderWithProviders(
        <MusdBonusSection
          chainId="0x1"
          tokenAddress={MUSD_TOKEN_ADDRESS}
          positionFiatValue={1000}
          showFiat
          hasPositiveBalance
        />,
      );

      expect(mockTrackEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({
          event: MetaMetricsEventName.MusdClaimBonusCtaDisplayed,
        }),
      );
    });

    it('does not fire MusdClaimBonusCtaDisplayed while a claim transaction is in-flight', () => {
      mockUseOnMerklClaimConfirmed.mockImplementation((cb: () => void) => {
        capturedOnConfirmed = cb;
        return { isClaimInFlight: true };
      });
      mockUseMerklRewards.mockReturnValue({
        hasClaimableReward: true,
        rewardAmountFiat: 10,
        lifetimeClaimedFiat: 5,
        isLoading: false,
        isEligible: true,
        claimableRewardDisplay: '10.00',
        hasClaimedBefore: false,
        refetch: mockRefetchRewards,
      });

      renderWithProviders(
        <MusdBonusSection
          chainId="0x1"
          tokenAddress={MUSD_TOKEN_ADDRESS}
          positionFiatValue={1000}
          showFiat
          hasPositiveBalance
        />,
      );

      expect(mockTrackEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({
          event: MetaMetricsEventName.MusdClaimBonusCtaDisplayed,
        }),
      );
    });

    it('fires MusdClaimBonusButtonClicked with location asset_overview when the claim button is clicked', () => {
      mockUseMerklRewards.mockReturnValue({
        hasClaimableReward: true,
        rewardAmountFiat: 5,
        lifetimeClaimedFiat: 0,
        isLoading: false,
        isEligible: true,
        claimableRewardDisplay: '5.00',
        hasClaimedBefore: false,
        refetch: mockRefetchRewards,
      });

      renderWithProviders(
        <MusdBonusSection
          chainId="0x1"
          tokenAddress={MUSD_TOKEN_ADDRESS}
          positionFiatValue={1000}
          showFiat
          hasPositiveBalance
        />,
      );

      fireEvent.click(screen.getByTestId('musd-claim-bonus-button'));

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: MetaMetricsEventName.MusdClaimBonusButtonClicked,
          properties: expect.objectContaining({
            location: 'asset_overview',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            network_chain_id: '0x1',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            network_name: 'Ethereum Mainnet',
          }),
        }),
      );
      expect(mockClaimRewards).toHaveBeenCalledTimes(1);
    });
  });
});
