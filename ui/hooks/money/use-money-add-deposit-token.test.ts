import { renderHook } from '@testing-library/react';
import {
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyScreenName,
} from '../../pages/money/constants/money-events';
import type { MoneyDepositToken } from './money-deposit-token-utils';
import { useMoneyAccountDeposit } from './useMoneyAccountDeposit';
import { useMoneyAnalytics } from './useMoneyAnalytics';
import { createMoneyAnalyticsMock } from './useMoneyAnalytics.mock';
import { useMoneyAddDepositToken } from './use-money-add-deposit-token';

jest.mock('./useMoneyAccountDeposit', () => ({
  useMoneyAccountDeposit: jest.fn(),
}));

jest.mock('./useMoneyAnalytics', () => ({
  useMoneyAnalytics: jest.fn(),
}));

const mockUseMoneyAccountDeposit = jest.mocked(useMoneyAccountDeposit);
const mockUseMoneyAnalytics = jest.mocked(useMoneyAnalytics);
const mockInitiateDeposit = jest.fn();

const token: MoneyDepositToken = {
  address: '0x0000000000000000000000000000000000000002',
  chainId: '0xe708',
  decimals: 6,
  image: 'usdc.png',
  symbol: 'USDC',
  title: 'USD Coin',
  moneyFiatAmountUsd: 25,
};

describe('useMoneyAddDepositToken', () => {
  const moneyAnalytics = createMoneyAnalyticsMock();

  beforeEach(() => {
    mockUseMoneyAnalytics.mockReturnValue(moneyAnalytics);
    mockUseMoneyAccountDeposit.mockReturnValue({
      initiateDeposit: mockInitiateDeposit,
      isLoading: false,
    } as unknown as ReturnType<typeof useMoneyAccountDeposit>);
  });

  const renderAddDepositToken = () =>
    renderHook(() =>
      useMoneyAddDepositToken({
        screenName: MoneyScreenName.MoneyPotentialEarnings,
        tokenRowComponentName: MoneyComponentName.PotentialEarningsTokenRow,
      }),
    ).result.current;

  it('tracks a token-row Add and deposits with the token pre-selected', () => {
    renderAddDepositToken().handleAddToken(token, 2, 5);

    expect(mockUseMoneyAnalytics).toHaveBeenCalledWith({
      screenName: MoneyScreenName.MoneyPotentialEarnings,
    });
    expect(moneyAnalytics.trackTokenButtonClicked).toHaveBeenCalledWith({
      buttonType: MoneyButtonType.Text,
      buttonIntent: MoneyButtonIntent.AddMoney,
      componentName: MoneyComponentName.PotentialEarningsTokenRow,
      labelKey: 'moneyAdd',
      redirectTarget: MoneyScreenName.MoneyDeposit,
      tokenSymbol: 'USDC',
      tokenChainId: '0xe708',
      tokenPositionInList: 3,
      tokensInList: 5,
      tokenHasBalance: true,
    });
    expect(mockInitiateDeposit).toHaveBeenCalledWith({
      preferredPaymentToken: { address: token.address, chainId: '0xe708' },
    });
  });

  it('tracks with the caller component and label when provided', () => {
    renderAddDepositToken().handleAddToken(token, 0, 5, {
      componentName: MoneyComponentName.ConvertCryptoButton,
      labelKey: 'moneyConvertYourCrypto',
    });

    expect(moneyAnalytics.trackTokenButtonClicked).toHaveBeenCalledWith(
      expect.objectContaining({
        componentName: MoneyComponentName.ConvertCryptoButton,
        labelKey: 'moneyConvertYourCrypto',
        tokenPositionInList: 1,
      }),
    );
    expect(mockInitiateDeposit).toHaveBeenCalledWith({
      preferredPaymentToken: { address: token.address, chainId: '0xe708' },
    });
  });
});
