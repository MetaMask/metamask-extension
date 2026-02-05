import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { Interface } from '@ethersproject/abi';
import { BigNumber } from 'bignumber.js';
import { TransactionType } from '@metamask/transaction-controller';
import { useNavigate } from 'react-router-dom';

import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../../../store/actions';
import { getSelectedInternalAccount } from '../../../../selectors';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../../helpers/constants/routes';
import {
  ARBITRUM_USDC,
  HYPERLIQUID_BRIDGE_ADDRESS,
} from '../../constants/perps';
import { ConfirmationLoader } from '../useConfirmationNavigation';

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

export type PerpsDepositTriggerOptions = {
  returnTo?: string;
};

export type PerpsDepositTriggerResult = {
  trigger: () => Promise<boolean>;
  isLoading: boolean;
};

/**
 * Pay/Confirmations-owned entrypoint for starting the Perps deposit confirmation flow.
 *
 * Encapsulates:
 * - transaction construction (perpsDeposit tx)
 * - routing into confirmations with the custom amount loader
 * - optional return routing after confirmation completes/cancels via router state
 *
 * @param options
 */
export function usePerpsDepositTrigger(
  options: PerpsDepositTriggerOptions = {},
): PerpsDepositTriggerResult {
  const navigate = useNavigate();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const [isLoading, setIsLoading] = useState(false);

  // Guard against accidental double-trigger in the same tick
  const isInFlightRef = useRef(false);

  const trigger = useCallback(async () => {
    if (isInFlightRef.current || isLoading) {
      return false;
    }

    if (!selectedAccount?.address) {
      console.error('No selected account');
      return false;
    }

    isInFlightRef.current = true;
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

      const search = new URLSearchParams({
        loader: ConfirmationLoader.CustomAmount,
      }).toString();

      navigate(
        {
          pathname: `${CONFIRM_TRANSACTION_ROUTE}/${txMeta.id}`,
          search,
        },
        {
          state: options.returnTo ? { returnTo: options.returnTo } : undefined,
        },
      );

      return true;
    } catch (error) {
      console.error('Failed to create perps deposit transaction', error);
      return false;
    } finally {
      isInFlightRef.current = false;
      setIsLoading(false);
    }
  }, [isLoading, navigate, options.returnTo, selectedAccount?.address]);

  return {
    trigger,
    isLoading,
  };
}
