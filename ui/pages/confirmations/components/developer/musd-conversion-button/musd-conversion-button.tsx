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
import { DeveloperButton } from '../developer-button';
import { MAINNET_MUSD } from '../../../constants/musd';

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

export const MusdConversionButton = () => {
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
        MAINNET_MUSD.chainId,
      );

      const transferData = generateERC20TransferData(
        MAINNET_MUSD.address,
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

      navigate(`${CONFIRM_TRANSACTION_ROUTE}/${txMeta.id}`);
    } catch (error) {
      console.error('Failed to create MUSD conversion transaction', error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, selectedAccount?.address]);

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
