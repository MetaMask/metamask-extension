import React from 'react';
import { TransactionType } from '@metamask/transaction-controller';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';

import { DeveloperButton } from '../developer-button';
import { MUSD_TOKEN, MUSD_TOKEN_ADDRESS } from '../../../constants/musd';
import { useDeveloperTransferTransaction } from '../utils';

export const MoneyAccountWithdrawButton = () => {
  const { isLoading, handleTrigger } = useDeveloperTransferTransaction({
    chainId: CHAIN_IDS.MONAD,
    tokenAddress: MUSD_TOKEN_ADDRESS,
    decimals: MUSD_TOKEN.decimals,
    type: TransactionType.moneyAccountWithdraw,
    errorMessage: 'Failed to create money account withdraw transaction',
  });

  return (
    <DeveloperButton
      title="Money Account Withdraw"
      onPress={handleTrigger}
      disabled={isLoading}
    />
  );
};
