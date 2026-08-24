import React from 'react';
import { render, screen } from '@testing-library/react';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { useAddToken } from '../../../hooks/tokens/useAddToken';
import { useTransactionPayWithdraw } from '../../../hooks/pay/useTransactionPayWithdraw';
import { MUSD_TOKEN_ADDRESS } from '../../../constants/musd';
import { CustomAmountInfo } from '../custom-amount-info';
import { useMoneyAccountBalance } from '../../../../../hooks/money/useMoneyAccountBalance';
import { MoneyAccountWithdrawInfo } from './money-account-withdraw-info';

jest.mock('../../../hooks/tokens/useAddToken', () => ({
  useAddToken: jest.fn(),
}));

jest.mock('../../../hooks/pay/useTransactionPayWithdraw', () => ({
  useTransactionPayWithdraw: jest.fn(() => ({
    isWithdraw: true,
    canSelectWithdrawToken: true,
  })),
}));

jest.mock('../../../../../hooks/money/useMoneyAccountBalance', () => ({
  useMoneyAccountBalance: jest.fn(),
}));

jest.mock('../../../../../contexts/route-messenger', () => ({
  RouteMessengerProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

jest.mock(
  '../../money-account-confirmations/money-account-withdraw-balance',
  () => ({
    MoneyAccountWithdrawBalance: () => (
      <div data-testid="money-account-withdraw-balance-mock" />
    ),
  }),
);

jest.mock('../custom-amount-info', () => ({
  CustomAmountInfo: jest.fn(({ children }: { children?: React.ReactNode }) => (
    <div data-testid="custom-amount-info">{children}</div>
  )),
}));

const useAddTokenMock = jest.mocked(useAddToken);
const useTransactionPayWithdrawMock = jest.mocked(useTransactionPayWithdraw);
const useMoneyAccountBalanceMock = jest.mocked(useMoneyAccountBalance);
const customAmountInfoMock = jest.mocked(CustomAmountInfo);

describe('MoneyAccountWithdrawInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTransactionPayWithdrawMock.mockReturnValue({
      isWithdraw: true,
      canSelectWithdrawToken: true,
    });
    useMoneyAccountBalanceMock.mockReturnValue({
      withdrawableFiatRaw: '7.06',
    } as ReturnType<typeof useMoneyAccountBalance>);
  });

  it('registers Monad mUSD via useAddToken', () => {
    render(<MoneyAccountWithdrawInfo />);

    expect(useAddTokenMock).toHaveBeenCalledWith({
      chainId: CHAIN_IDS.MONAD,
      decimals: 6,
      symbol: 'mUSD',
      tokenAddress: MUSD_TOKEN_ADDRESS,
    });
  });

  it('renders CustomAmountInfo for a USD withdraw with vault balance as the max source', () => {
    render(<MoneyAccountWithdrawInfo />);

    expect(screen.getByTestId('custom-amount-info')).toBeInTheDocument();
    expect(customAmountInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        autoFocusAmount: true,
        balanceUsdOverride: 7.06,
        currency: 'usd',
        disablePay: false,
        displayAccountRow: true,
        displayPercentageButtons: true,
        hidePayTokenAmount: true,
        preferredToken: {
          address: MUSD_TOKEN_ADDRESS,
          chainId: CHAIN_IDS.MONAD,
        },
      }),
      expect.anything(),
    );
  });

  it('renders the withdrawable-balance subtitle inside CustomAmountInfo', () => {
    render(<MoneyAccountWithdrawInfo />);

    expect(
      screen.getByTestId('money-account-withdraw-balance-mock'),
    ).toBeInTheDocument();
  });

  it('disables pay when withdraw token selection is not enabled', () => {
    useTransactionPayWithdrawMock.mockReturnValue({
      isWithdraw: true,
      canSelectWithdrawToken: false,
    });

    render(<MoneyAccountWithdrawInfo />);

    expect(customAmountInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        disablePay: true,
      }),
      expect.anything(),
    );
  });

  it('uses 0 as the max source when the withdrawable balance is unknown', () => {
    useMoneyAccountBalanceMock.mockReturnValue({
      withdrawableFiatRaw: undefined,
    } as ReturnType<typeof useMoneyAccountBalance>);

    render(<MoneyAccountWithdrawInfo />);

    expect(customAmountInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        balanceUsdOverride: 0,
      }),
      expect.anything(),
    );
  });
});
