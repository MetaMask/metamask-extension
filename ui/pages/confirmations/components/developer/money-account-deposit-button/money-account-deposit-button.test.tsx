import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';
import {
  MUSD_CONVERSION_DEFAULT_CHAIN_ID,
  MUSD_TOKEN,
  MUSD_TOKEN_ADDRESS,
} from '../../../constants/musd';
import { useDeveloperTransferTransaction } from '../utils';
import { MoneyAccountDepositButton } from './money-account-deposit-button';

jest.mock('../utils', () => ({
  useDeveloperTransferTransaction: jest.fn(),
}));

const useDeveloperTransferTransactionMock = jest.mocked(
  useDeveloperTransferTransaction,
);

describe('MoneyAccountDepositButton', () => {
  const handleTriggerMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useDeveloperTransferTransactionMock.mockReturnValue({
      isLoading: false,
      handleTrigger: handleTriggerMock,
    });
  });

  it('configures the transfer hook for a mUSD money account deposit', () => {
    render(<MoneyAccountDepositButton />);

    expect(useDeveloperTransferTransactionMock).toHaveBeenCalledWith({
      chainId: MUSD_CONVERSION_DEFAULT_CHAIN_ID,
      tokenAddress: MUSD_TOKEN_ADDRESS,
      decimals: MUSD_TOKEN.decimals,
      type: TransactionType.moneyAccountDeposit,
      errorMessage: 'Failed to create money account deposit transaction',
    });
  });

  it('renders the developer button and triggers the transaction on click', () => {
    render(<MoneyAccountDepositButton />);

    const button = screen.getByRole('button', {
      name: 'Money Account Deposit',
    });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(handleTriggerMock).toHaveBeenCalledTimes(1);
  });

  it('disables the button while loading', () => {
    useDeveloperTransferTransactionMock.mockReturnValue({
      isLoading: true,
      handleTrigger: handleTriggerMock,
    });

    render(<MoneyAccountDepositButton />);

    expect(
      screen.getByRole('button', { name: 'Money Account Deposit' }),
    ).toBeDisabled();
  });
});
