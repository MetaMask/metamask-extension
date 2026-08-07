import React from 'react';
import { TransactionType } from '@metamask/transaction-controller';

import { DeveloperButton } from '../developer-button';
import {
  MUSD_CONVERSION_DEFAULT_CHAIN_ID,
  MUSD_TOKEN,
  MUSD_TOKEN_ADDRESS,
} from '../../../constants/musd';
import { useDeveloperTransferTransaction } from '../utils';

export const MoneyAccountDepositButton = () => {
  const { isLoading, handleTrigger } = useDeveloperTransferTransaction({
    chainId: MUSD_CONVERSION_DEFAULT_CHAIN_ID,
    tokenAddress: MUSD_TOKEN_ADDRESS,
    decimals: MUSD_TOKEN.decimals,
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
