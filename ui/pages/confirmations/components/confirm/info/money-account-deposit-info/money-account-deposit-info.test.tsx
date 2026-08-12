import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAddToken } from '../../../../hooks/tokens/useAddToken';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import {
  MUSD_CONVERSION_DEFAULT_CHAIN_ID,
  MUSD_TOKEN_ADDRESS,
} from '../../../../constants/musd';
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

  it('registers the mUSD token via useAddToken with the branded symbol', () => {
    render(<MoneyAccountDepositInfo />);

    expect(useAddTokenMock).toHaveBeenCalledWith({
      chainId: MUSD_CONVERSION_DEFAULT_CHAIN_ID,
      decimals: 6,
      symbol: 'mUSD',
      tokenAddress: MUSD_TOKEN_ADDRESS,
    });
  });

  it('renders CustomAmountInfo with the account row for a USD fiat deposit', () => {
    render(<MoneyAccountDepositInfo />);

    expect(screen.getByTestId('custom-amount-info')).toBeInTheDocument();
    expect(customAmountInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        autoFocusAmount: true,
        currency: 'usd',
        displayAccountRow: true,
        hidePayTokenAmount: true,
      }),
      expect.anything(),
    );
  });
});
