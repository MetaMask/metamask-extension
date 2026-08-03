import React from 'react';
import { TransactionType } from '@metamask/transaction-controller';

import { DeveloperButton } from '../developer-button';
import { MAINNET_MUSD } from '../../../constants/musd';
import { useDeveloperTransferTransaction } from '../utils';

export const MusdConversionButton = () => {
  const { isLoading, handleTrigger } = useDeveloperTransferTransaction({
    chainId: MAINNET_MUSD.chainId,
    tokenAddress: MAINNET_MUSD.address,
    decimals: MAINNET_MUSD.decimals,
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
