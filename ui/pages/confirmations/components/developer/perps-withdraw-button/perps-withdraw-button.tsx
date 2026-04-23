import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { TransactionType } from '@metamask/transaction-controller';

import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../../../../store/actions';
import { getSelectedInternalAccount } from '../../../../../selectors';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { DeveloperButton } from '../developer-button';
import { ARBITRUM_USDC } from '../../../constants/perps';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../../hooks/useConfirmationNavigation';
import { generateERC20TransferData } from '../utils';

export const PerpsWithdrawButton = () => {
  const { navigateToTransaction } = useConfirmationNavigation();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTrigger = useCallback(async () => {
    if (!selectedAccount?.address) {
      console.error('No selected account');
      return;
    }

    setIsLoading(true);

    try {
      const networkClientId = await findNetworkClientIdByChainId(
        CHAIN_IDS.ARBITRUM,
      );

      // Placeholder 0-USDC transfer: the real withdraw flow uses a Hyperliquid
      // signed withdraw action, not an on-chain ERC-20 transfer. Recipient is
      // the user's own address since withdrawn USDC ultimately returns to them.
      const transferData = generateERC20TransferData(
        selectedAccount.address as Hex,
        '0',
        ARBITRUM_USDC.decimals,
      );

      const txMeta = await addTransaction(
        {
          from: selectedAccount.address as Hex,
          to: ARBITRUM_USDC.address,
          data: transferData,
          value: '0x0',
        },
        {
          networkClientId,
          type: TransactionType.perpsWithdraw,
        },
      );

      setHasTriggered(true);

      navigateToTransaction(txMeta.id, {
        loader: ConfirmationLoader.CustomAmount,
      });
    } catch (error) {
      console.error('Failed to create perps withdraw transaction', error);
    } finally {
      setIsLoading(false);
    }
  }, [navigateToTransaction, selectedAccount?.address]);

  return (
    <DeveloperButton
      title="Perps Withdraw"
      description="Triggers a Perps withdraw confirmation."
      buttonLabel={isLoading ? 'Loading...' : 'Trigger'}
      onPress={handleTrigger}
      hasTriggered={hasTriggered}
      disabled={isLoading}
    />
  );
};
