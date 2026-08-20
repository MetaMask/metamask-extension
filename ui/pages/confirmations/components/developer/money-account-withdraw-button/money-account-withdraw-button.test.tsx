import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { MUSD_TOKEN, MUSD_TOKEN_ADDRESS } from '../../../constants/musd';
import { useDeveloperTransferTransaction } from '../utils';
import { MoneyAccountWithdrawButton } from './money-account-withdraw-button';

jest.mock('../utils', () => ({
  useDeveloperTransferTransaction: jest.fn(),
}));

const useDeveloperTransferTransactionMock = jest.mocked(
  useDeveloperTransferTransaction,
);

describe('MoneyAccountWithdrawButton', () => {
  const handleTriggerMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useDeveloperTransferTransactionMock.mockReturnValue({
      isLoading: false,
      handleTrigger: handleTriggerMock,
    });
  });

  it('configures the transfer hook for a Monad mUSD money account withdraw', () => {
    render(<MoneyAccountWithdrawButton />);

    expect(useDeveloperTransferTransactionMock).toHaveBeenCalledWith({
      chainId: CHAIN_IDS.MONAD,
      tokenAddress: MUSD_TOKEN_ADDRESS,
      decimals: MUSD_TOKEN.decimals,
      type: TransactionType.moneyAccountWithdraw,
      errorMessage: 'Failed to create money account withdraw transaction',
    });
  });

  it('renders the developer button and triggers the transaction on click', () => {
    render(<MoneyAccountWithdrawButton />);

    const button = screen.getByRole('button', {
      name: 'Money Account Withdraw',
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

    render(<MoneyAccountWithdrawButton />);

    expect(
      screen.getByRole('button', { name: 'Money Account Withdraw' }),
    ).toBeDisabled();
  });
});
