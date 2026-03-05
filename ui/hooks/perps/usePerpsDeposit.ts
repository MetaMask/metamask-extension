import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { Interface } from '@ethersproject/abi';
import { BigNumber } from 'bignumber.js';
import { TransactionType } from '@metamask/transaction-controller';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../store/actions';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  ARBITRUM_USDC,
  HYPERLIQUID_BRIDGE_ADDRESS,
} from '../../pages/confirmations/constants/perps';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../pages/confirmations/hooks/useConfirmationNavigation';

const ERC20_ABI = ['function transfer(address to, uint256 amount)'];
const erc20Interface = new Interface(ERC20_ABI);

function generateERC20TransferData(
  recipient: Hex,
  amount: string,
  decimals: number,
): Hex {
  const multiplier = new BigNumber(10).pow(decimals);
  const amountRaw = new BigNumber(amount).times(multiplier);

  return erc20Interface.encodeFunctionData('transfer', [
    recipient,
    `0x${amountRaw.toString(16)}`,
  ]) as Hex;
}

/**
 * Hook that triggers the Perps deposit (add funds) flow.
 * Creates an ERC20 USDC transfer to the HyperLiquid bridge on Arbitrum
 * and navigates to the transaction confirmation screen.
 *
 * @returns Object with `triggerDeposit` callback and `isLoading` state.
 */
export function usePerpsDeposit() {
  const { navigateToTransaction } = useConfirmationNavigation();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const [isLoading, setIsLoading] = useState(false);

  const triggerDeposit = useCallback(async () => {
    if (!selectedAccount?.address) {
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

      navigateToTransaction(txMeta.id, {
        loader: ConfirmationLoader.CustomAmount,
      });
    } catch (error) {
      // Deposit creation failed — silently handled
    } finally {
      setIsLoading(false);
    }
  }, [navigateToTransaction, selectedAccount?.address]);

  return { triggerDeposit, isLoading };
}
