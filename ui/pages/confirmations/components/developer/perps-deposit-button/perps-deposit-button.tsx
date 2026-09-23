import React from 'react';
import { TransactionType } from '@metamask/transaction-controller';

import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { DeveloperButton } from '../developer-button';
import {
  ARBITRUM_USDC,
  HYPERLIQUID_BRIDGE_ADDRESS,
} from '../../../constants/perps';
import { useDeveloperTransferTransaction } from '../utils';

export const PerpsDepositButton = () => {
  const { isLoading, handleTrigger } = useDeveloperTransferTransaction({
    chainId: CHAIN_IDS.ARBITRUM,
    tokenAddress: ARBITRUM_USDC.address,
    decimals: ARBITRUM_USDC.decimals,
    type: TransactionType.perpsDeposit,
    errorMessage: 'Failed to create perps deposit transaction',
    getRecipient: () => HYPERLIQUID_BRIDGE_ADDRESS,
  });

  return (
    <DeveloperButton
      title="Perps Deposit"
      onPress={handleTrigger}
      disabled={isLoading}
    />
  );
};
