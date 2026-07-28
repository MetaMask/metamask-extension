import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';
import { MAINNET_MUSD } from '../../../constants/musd';
import { useDeveloperTransferTransaction } from '../utils';
import { MusdConversionButton } from './musd-conversion-button';

jest.mock('../utils', () => ({
  useDeveloperTransferTransaction: jest.fn(),
}));

const useDeveloperTransferTransactionMock = jest.mocked(
  useDeveloperTransferTransaction,
);

describe('MusdConversionButton', () => {
  const handleTriggerMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useDeveloperTransferTransactionMock.mockReturnValue({
      isLoading: false,
      handleTrigger: handleTriggerMock,
    });
  });

  it('configures the transfer hook for a mUSD conversion', () => {
    render(<MusdConversionButton />);

    expect(useDeveloperTransferTransactionMock).toHaveBeenCalledWith({
      chainId: MAINNET_MUSD.chainId,
      tokenAddress: MAINNET_MUSD.address,
      decimals: MAINNET_MUSD.decimals,
      type: TransactionType.musdConversion,
      errorMessage: 'Failed to create MUSD conversion transaction',
    });
  });

  it('renders the developer button and triggers the transaction on click', () => {
    render(<MusdConversionButton />);

    const button = screen.getByRole('button', { name: 'MUSD Conversion' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleTriggerMock).toHaveBeenCalledTimes(1);
  });

  it('disables the button while loading', () => {
    useDeveloperTransferTransactionMock.mockReturnValue({
      isLoading: true,
      handleTrigger: handleTriggerMock,
    });

    render(<MusdConversionButton />);

    expect(
      screen.getByRole('button', { name: 'MUSD Conversion' }),
    ).toBeDisabled();
  });
});
