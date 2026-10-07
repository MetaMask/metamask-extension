import React from 'react';
import { TransactionType } from '@metamask/transaction-controller';

import { MUSD_TOKEN, MUSD_TOKEN_ADDRESS } from '@metamask/money-account-utils';
import { DeveloperButton } from '../developer-button/developer-button';
import { MUSD_CONVERSION_DEFAULT_CHAIN_ID } from '../../../constants/musd';
import { useDeveloperTransferTransaction } from '../utils';

export const MusdConversionButton = () => {
  const { isLoading, handleTrigger } = useDeveloperTransferTransaction({
    chainId: MUSD_CONVERSION_DEFAULT_CHAIN_ID,
    tokenAddress: MUSD_TOKEN_ADDRESS,
    decimals: MUSD_TOKEN.decimals,
    type: TransactionType.musdConversion,
    errorMessage: 'Failed to create MUSD conversion transaction',
  });

  return (
    <DeveloperButton
      title="MUSD Conversion"
      onPress={handleTrigger}
      disabled={isLoading}
    />
  );
};
