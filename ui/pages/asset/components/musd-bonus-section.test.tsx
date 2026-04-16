/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { I18nContext } from '../../../contexts/i18n';
import { getMessage } from '../../../helpers/utils/i18n-helper';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { MUSD_TOKEN_ADDRESS } from '../../../components/app/musd/constants';
import { MusdBonusSection } from './musd-bonus-section';

const mockRefetchRewards = jest.fn();
const mockUseMerklRewards = jest.fn().mockReturnValue({
  hasClaimableReward: false,
  rewardAmountFiat: null,
  lifetimeClaimedFiat: 5,
  isLoading: false,
  isEligible: true,
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
    selectIsMerklClaimingEnabled: () => true,
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
    capturedOnConfirmed = null;
    mockRefetchRewards.mockClear();
    mockUseMerklRewards.mockReturnValue({
      hasClaimableReward: false,
      rewardAmountFiat: null,
      lifetimeClaimedFiat: 5,
      isLoading: false,
      isEligible: true,
      refetch: mockRefetchRewards,
    });
    mockUseMerklClaim.mockReturnValue({
      claimRewards: mockClaimRewards,
      isClaiming: false,
      error: null,
    });
    mockClaimRewards.mockClear();
  });

  it('renders section title and bonus rows', () => {
    renderWithProviders(
      <MusdBonusSection
        chainId="0x1"
        tokenAddress={MUSD_TOKEN_ADDRESS}
        positionFiatValue={1000}
        showFiat
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
      });

      renderWithProviders(
        <MusdBonusSection
          chainId="0x1"
          tokenAddress={MUSD_TOKEN_ADDRESS}
          positionFiatValue={1000}
          showFiat
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
      });

      renderWithProviders(
        <MusdBonusSection
          chainId="0x1"
          tokenAddress={MUSD_TOKEN_ADDRESS}
          positionFiatValue={1000}
          showFiat
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
      });

      renderWithProviders(
        <MusdBonusSection
          chainId="0x1"
          tokenAddress={MUSD_TOKEN_ADDRESS}
          positionFiatValue={1000}
          showFiat
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
      });

      renderWithProviders(
        <MusdBonusSection
          chainId="0x1"
          tokenAddress={MUSD_TOKEN_ADDRESS}
          positionFiatValue={0}
          showFiat
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
        />,
      );

      const button = screen.getByTestId('musd-claim-bonus-button');
      expect(button).toBeDisabled();
    });
  });
});
