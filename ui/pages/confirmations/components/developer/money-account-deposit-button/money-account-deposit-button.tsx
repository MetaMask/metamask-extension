import React from 'react';
import { TransactionType } from '@metamask/transaction-controller';

import { DeveloperButton } from '../developer-button';
import { MAINNET_MUSD } from '../../../constants/musd';
import { useDeveloperTransferTransaction } from '../utils';

export const MoneyAccountDepositButton = () => {
  const { isLoading, handleTrigger } = useDeveloperTransferTransaction({
    chainId: MAINNET_MUSD.chainId,
    tokenAddress: MAINNET_MUSD.address,
    decimals: MAINNET_MUSD.decimals,
    type: TransactionType.moneyAccountDeposit,
    errorMessage: 'Failed to create money account deposit transaction',
  });

  return (
    <DeveloperButton
      title="Money Account Deposit"
      onPress={handleTrigger}
      disabled={isLoading}
    />
  );
};
