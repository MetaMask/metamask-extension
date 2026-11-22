import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import {
  ARBITRUM_USDC,
  HYPERLIQUID_BRIDGE_ADDRESS,
} from '../../../constants/perps';
import { useDeveloperTransferTransaction } from '../utils';
import { PerpsDepositButton } from './perps-deposit-button';

jest.mock('../utils', () => ({
  useDeveloperTransferTransaction: jest.fn(),
}));

const useDeveloperTransferTransactionMock = jest.mocked(
  useDeveloperTransferTransaction,
);

describe('PerpsDepositButton', () => {
  const handleTriggerMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useDeveloperTransferTransactionMock.mockReturnValue({
      isLoading: false,
      handleTrigger: handleTriggerMock,
    });
  });

  it('configures the transfer hook for a perps deposit on Arbitrum', () => {
    render(<PerpsDepositButton />);

    expect(useDeveloperTransferTransactionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: CHAIN_IDS.ARBITRUM,
        tokenAddress: ARBITRUM_USDC.address,
        decimals: ARBITRUM_USDC.decimals,
        type: TransactionType.perpsDeposit,
        errorMessage: 'Failed to create perps deposit transaction',
      }),
    );
  });

  it('sends the transfer to the Hyperliquid bridge address', () => {
    render(<PerpsDepositButton />);

    const { getRecipient } =
      useDeveloperTransferTransactionMock.mock.calls[0][0];

    expect(getRecipient?.('0xsender')).toBe(HYPERLIQUID_BRIDGE_ADDRESS);
  });

  it('renders the developer button and triggers the transaction on click', () => {
    render(<PerpsDepositButton />);

    const button = screen.getByRole('button', { name: 'Perps Deposit' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleTriggerMock).toHaveBeenCalledTimes(1);
  });

  it('disables the button while loading', () => {
    useDeveloperTransferTransactionMock.mockReturnValue({
      isLoading: true,
      handleTrigger: handleTriggerMock,
    });

    render(<PerpsDepositButton />);

    expect(
      screen.getByRole('button', { name: 'Perps Deposit' }),
    ).toBeDisabled();
  });
});
