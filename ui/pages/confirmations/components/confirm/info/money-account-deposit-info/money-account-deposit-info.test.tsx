import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAddToken } from '../../../../hooks/tokens/useAddToken';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import { MAINNET_MUSD } from '../../../../constants/musd';
import { MoneyAccountDepositInfo } from './money-account-deposit-info';

jest.mock('../../../../hooks/tokens/useAddToken', () => ({
  useAddToken: jest.fn(),
}));

jest.mock('../../../info/custom-amount-info', () => ({
  CustomAmountInfo: jest.fn(() => <div data-testid="custom-amount-info" />),
}));

const useAddTokenMock = jest.mocked(useAddToken);
const customAmountInfoMock = jest.mocked(CustomAmountInfo);

describe('MoneyAccountDepositInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers the mUSD token via useAddToken', () => {
    render(<MoneyAccountDepositInfo />);

    expect(useAddTokenMock).toHaveBeenCalledWith({
      chainId: MAINNET_MUSD.chainId,
      decimals: MAINNET_MUSD.decimals,
      symbol: MAINNET_MUSD.symbol,
      tokenAddress: MAINNET_MUSD.address,
    });
  });

  it('renders CustomAmountInfo configured for a USD fiat deposit', () => {
    render(<MoneyAccountDepositInfo />);

    expect(screen.getByTestId('custom-amount-info')).toBeInTheDocument();
    expect(customAmountInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        autoFocusAmount: true,
        currency: 'usd',
        hidePayTokenAmount: true,
      }),
      expect.anything(),
    );
  });
});
