import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Interface } from '@ethersproject/abi';
import { TransactionType } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';

import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { getSelectedInternalAccount } from '../../../../selectors';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../../../store/actions';
import { ARBITRUM_USDC } from '../../../../pages/confirmations/constants/perps';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../../../pages/confirmations/hooks/useConfirmationNavigation';

const ERC20_ABI = ['function transfer(address to, uint256 amount)'];
const erc20Interface = new Interface(ERC20_ABI);

export type PerpsWithdrawConfirmationResponse = {
  transactionId: string;
};

export type PerpsWithdrawConfirmationOptions = {
  onCreated?: (transactionId: string) => void;
  navigateOnCreate?: boolean;
};

export type PerpsWithdrawConfirmationResult = {
  trigger: () => Promise<PerpsWithdrawConfirmationResponse | null>;
  isLoading: boolean;
};

function generateZeroUsdcTransferData(recipient: Hex): Hex {
  return erc20Interface.encodeFunctionData('transfer', [recipient, 0]) as Hex;
}

/**
 * Confirmations-owned entrypoint for starting the Perps withdraw flow.
 *
 * Creates a placeholder Arbitrum USDC transfer typed as `perpsWithdraw`; the
 * confirmation Pay flow replaces the amount and executes the HyperLiquid
 * withdraw path through post-quote handling.
 *
 * @param options
 */
export function usePerpsWithdrawConfirmation(
  options: PerpsWithdrawConfirmationOptions = {},
): PerpsWithdrawConfirmationResult {
  const { onCreated, navigateOnCreate = true } = options;
  const { navigateToTransaction } = useConfirmationNavigation();
  const location = useLocation();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const [isLoading, setIsLoading] = useState(false);

  const isInFlightRef = useRef(false);

  const trigger = useCallback(async () => {
    if (isInFlightRef.current) {
      return null;
    }

    if (!selectedAccount?.address) {
      console.error('No selected account');
      return null;
    }

    isInFlightRef.current = true;
    setIsLoading(true);

    try {
      const networkClientId = await findNetworkClientIdByChainId(
        CHAIN_IDS.ARBITRUM,
      );
      const from = selectedAccount.address as Hex;
      const txMeta = await addTransaction(
        {
          from,
          to: ARBITRUM_USDC.address,
          data: generateZeroUsdcTransferData(from),
          value: '0x0',
        },
        {
          networkClientId,
          type: TransactionType.perpsWithdraw,
        },
      );

      if (navigateOnCreate) {
        const goBackTo = location.pathname + location.search;
        navigateToTransaction(txMeta.id, {
          loader: ConfirmationLoader.CustomAmount,
          ...(goBackTo === '/' ? {} : { goBackTo }),
        });
      }

      onCreated?.(txMeta.id);

      return { transactionId: txMeta.id };
    } catch (error) {
      console.error('Failed to create perps withdraw confirmation', error);
      return null;
    } finally {
      isInFlightRef.current = false;
      setIsLoading(false);
    }
  }, [
    location.pathname,
    location.search,
    navigateOnCreate,
    navigateToTransaction,
    onCreated,
    selectedAccount?.address,
  ]);

  return {
    trigger,
    isLoading,
  };
}
