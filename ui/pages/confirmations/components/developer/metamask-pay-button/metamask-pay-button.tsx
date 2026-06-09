import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { TransactionType } from '@metamask/transaction-controller';

import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../../../../store/actions';
import { getSelectedInternalAccount } from '../../../../../../shared/lib/selectors/accounts';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { DeveloperButton } from '../developer-button';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../../hooks/useConfirmationNavigation';
import { generateERC20TransferData } from '../utils';

// Plain string cast avoids importing UI constants into background context.
export const METAMASK_PAY_TEST_TYPE =
  'metamaskPayTest' as unknown as TransactionType;

const MAINNET_USDC_ADDRESS =
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Hex;
const USDC_DECIMALS = 6;

export const MetaMaskPayButton = () => {
  const { navigateToTransaction } = useConfirmationNavigation();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const [isLoading, setIsLoading] = useState(false);

  const handleTrigger = useCallback(async () => {
    if (!selectedAccount?.address) {
      console.error('No selected account');
      return;
    }

    setIsLoading(true);

    try {
      const networkClientId = await findNetworkClientIdByChainId(
        CHAIN_IDS.MAINNET,
      );

      const transferData = generateERC20TransferData(
        selectedAccount.address as Hex,
        '0',
        USDC_DECIMALS,
      );

      const txMeta = await addTransaction(
        {
          from: selectedAccount.address as Hex,
          to: MAINNET_USDC_ADDRESS,
          data: transferData,
          value: '0x0',
        },
        {
          networkClientId,
          type: METAMASK_PAY_TEST_TYPE,
        },
      );

      navigateToTransaction(txMeta.id, {
        loader: ConfirmationLoader.CustomAmount,
      });
    } catch (error) {
      console.error('Failed to create MetaMask Pay test transaction', error);
    } finally {
      setIsLoading(false);
    }
  }, [navigateToTransaction, selectedAccount?.address]);

  return (
    <DeveloperButton
      title="MM Pay Test"
      onPress={handleTrigger}
      disabled={isLoading}
    />
  );
};
