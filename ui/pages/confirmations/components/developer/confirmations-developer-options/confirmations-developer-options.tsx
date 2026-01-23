import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { Hex } from '@metamask/utils';
import { Interface } from '@ethersproject/abi';
import { BigNumber } from 'bignumber.js';

import { Text } from '../../../../../components/component-library';
import { TextColor } from '../../../../../helpers/constants/design-system';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../../../helpers/constants/routes';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../../../../store/actions';
import { getSelectedInternalAccount } from '../../../../../selectors';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { EXAMPLE_CUSTOM_AMOUNT_TRANSACTION_TYPE } from '../../../../../../shared/constants/transaction';
import { DeveloperButton } from '../developer-button';

const MAINNET_USDC_ADDRESS =
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as Hex;
const USDC_DECIMALS = 6;

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

const ExampleCustomAmountButton = () => {
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
          type: EXAMPLE_CUSTOM_AMOUNT_TRANSACTION_TYPE,
        },
      );

      setHasTriggered(true);

      navigate(`${CONFIRM_TRANSACTION_ROUTE}/${txMeta.id}`);
    } catch (error) {
      console.error(
        'Failed to create example custom amount transaction',
        error,
      );
    } finally {
      setIsLoading(false);
    }
  }, [navigate, selectedAccount?.address]);

  return (
    <DeveloperButton
      title="Custom Amount"
      description="Triggers a custom amount confirmation that transfers to USDC on mainnet."
      buttonLabel={isLoading ? 'Loading...' : 'Trigger'}
      onPress={handleTrigger}
      hasTriggered={hasTriggered}
      disabled={isLoading}
    />
  );
};

export const ConfirmationsDeveloperOptions = () => {
  return (
    <>
      <Text
        className="settings-page__security-tab-sub-header__bold"
        paddingTop={6}
      >
        Confirmations
      </Text>
      <Text
        className="settings-page__security-tab-sub-header"
        color={TextColor.textAlternative}
        paddingTop={4}
      >
        Example Confirmations
      </Text>
      <div className="settings-page__content-padded">
        <ExampleCustomAmountButton />
      </div>
    </>
  );
};
