import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { TransactionType } from '@metamask/transaction-controller';

import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../../../../store/actions';
import { getSelectedInternalAccount } from '../../../../../selectors';
import { DeveloperButton } from '../developer-button';
import { MAINNET_MUSD } from '../../../constants/musd';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../../hooks/useConfirmationNavigation';
import { generateERC20TransferData } from '../utils';

export const MusdConversionButton = () => {
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
        MAINNET_MUSD.chainId,
      );

      const transferData = generateERC20TransferData(
        selectedAccount.address as Hex,
        '0',
        MAINNET_MUSD.decimals,
      );

      const txMeta = await addTransaction(
        {
          from: selectedAccount.address as Hex,
          to: MAINNET_MUSD.address,
          data: transferData,
          value: '0x0',
        },
        {
          networkClientId,
          type: TransactionType.musdConversion,
        },
      );

      setHasTriggered(true);

      navigateToTransaction(txMeta.id, {
        loader: ConfirmationLoader.CustomAmount,
      });
    } catch (error) {
      console.error('Failed to create MUSD conversion transaction', error);
    } finally {
      setIsLoading(false);
    }
  }, [navigateToTransaction, selectedAccount?.address]);

  return (
    <DeveloperButton
      title="MUSD Conversion"
      description="Triggers a MUSD conversion confirmation."
      buttonLabel={isLoading ? 'Loading...' : 'Trigger'}
      onPress={handleTrigger}
      hasTriggered={hasTriggered}
      disabled={isLoading}
    />
  );
};
