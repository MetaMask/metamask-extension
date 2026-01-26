import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { Hex } from '@metamask/utils';
import { Interface } from '@ethersproject/abi';
import { BigNumber } from 'bignumber.js';
import { TransactionType } from '@metamask/transaction-controller';

import { CONFIRM_TRANSACTION_ROUTE } from '../../../../../helpers/constants/routes';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../../../../store/actions';
import { getSelectedInternalAccount } from '../../../../../selectors';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { DeveloperButton } from '../developer-button';
import {
  ARBITRUM_USDC,
  HYPERLIQUID_BRIDGE_ADDRESS,
} from '../../../constants/perps';

const ERC20_ABI = ['function transfer(address to, uint256 amount)'];
const erc20Interface = new Interface(ERC20_ABI);

const generateERC20TransferData = (
  recipient: Hex,
  amount: string,
  decimals: number,
): Hex => {
  const multiplier = new BigNumber(10).pow(decimals);
  const amountRaw = new BigNumber(amount).times(multiplier);

  return erc20Interface.encodeFunctionData('transfer', [
    recipient,
    `0x${amountRaw.toString(16)}`,
  ]) as Hex;
};

export const PerpsDepositButton = () => {
  const navigate = useNavigate();
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

      const transferData = generateERC20TransferData(
        HYPERLIQUID_BRIDGE_ADDRESS,
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
          type: TransactionType.perpsDeposit,
        },
      );

      setHasTriggered(true);

      navigate(`${CONFIRM_TRANSACTION_ROUTE}/${txMeta.id}`);
    } catch (error) {
      console.error('Failed to create perps deposit transaction', error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, selectedAccount?.address]);

  return (
    <DeveloperButton
      title="Perps Deposit"
      description="Triggers a Perps deposit confirmation."
      buttonLabel={isLoading ? 'Loading...' : 'Trigger'}
      onPress={handleTrigger}
      hasTriggered={hasTriggered}
      disabled={isLoading}
    />
  );
};
