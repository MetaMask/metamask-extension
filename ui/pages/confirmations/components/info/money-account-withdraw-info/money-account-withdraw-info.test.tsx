import React from 'react';
import { render, screen } from '@testing-library/react';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { useAddToken } from '../../../hooks/tokens/useAddToken';
import { useTransactionPayWithdraw } from '../../../hooks/pay/useTransactionPayWithdraw';
import { MUSD_TOKEN_ADDRESS } from '../../../constants/musd';
import { CustomAmountInfo } from '../custom-amount-info';
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

jest.mock('../custom-amount-info', () => ({
  CustomAmountInfo: jest.fn(() => <div data-testid="custom-amount-info" />),
}));

const useAddTokenMock = jest.mocked(useAddToken);
const useTransactionPayWithdrawMock = jest.mocked(useTransactionPayWithdraw);
const customAmountInfoMock = jest.mocked(CustomAmountInfo);

describe('MoneyAccountWithdrawInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTransactionPayWithdrawMock.mockReturnValue({
      isWithdraw: true,
      canSelectWithdrawToken: true,
    });
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

  it('renders CustomAmountInfo for a USD withdraw with account row and preferred Monad mUSD', () => {
    render(<MoneyAccountWithdrawInfo />);

    expect(screen.getByTestId('custom-amount-info')).toBeInTheDocument();
    expect(customAmountInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        autoFocusAmount: true,
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
});
