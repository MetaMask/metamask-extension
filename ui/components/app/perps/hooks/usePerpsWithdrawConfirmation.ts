import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Hex } from '@metamask/utils';
import { Interface } from '@ethersproject/abi';
import { TransactionType } from '@metamask/transaction-controller';

import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../../../store/actions';
import { getSelectedInternalAccount } from '../../../../selectors';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../../helpers/constants/routes';
import { ARBITRUM_USDC } from '../../../../pages/confirmations/constants/perps';
import { ConfirmationLoader } from '../../../../pages/confirmations/hooks/useConfirmationNavigation';

const ERC20_ABI = ['function transfer(address to, uint256 amount)'];
const erc20Interface = new Interface(ERC20_ABI);

const generateERC20TransferData = (recipient: Hex, amount: string): Hex =>
  erc20Interface.encodeFunctionData('transfer', [recipient, amount]) as Hex;

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

/**
 * Perps-owned entrypoint for starting the Perps withdraw confirmation flow.
 *
 * Sibling to `usePerpsDepositConfirmation`: creates a placeholder 0-amount
 * ERC-20 transfer typed as `perpsWithdraw` on Arbitrum and routes into the
 * CustomAmount confirmation. `TransactionPayController` (in post-quote /
 * HyperLiquid-source mode) is responsible for turning it into a real
 * HyperLiquid withdrawal via Relay.
 *
 * @param options
 */
export function usePerpsWithdrawConfirmation(
  options: PerpsWithdrawConfirmationOptions = {},
): PerpsWithdrawConfirmationResult {
  const { onCreated, navigateOnCreate = true } = options;
  const navigate = useNavigate();
  const location = useLocation();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const [isLoading, setIsLoading] = useState(false);

  const isInFlightRef = useRef(false);

  const trigger = useCallback(async () => {
    if (isInFlightRef.current || isLoading) {
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

      const transferData = generateERC20TransferData(
        ARBITRUM_USDC.address,
        '0x0',
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

      if (navigateOnCreate) {
        const params = new URLSearchParams({
          loader: ConfirmationLoader.CustomAmount,
        });

        const goBackTo = location.pathname + location.search;
        if (goBackTo && goBackTo !== '/') {
          params.set('goBackTo', goBackTo);
        }

        navigate({
          pathname: `${CONFIRM_TRANSACTION_ROUTE}/${txMeta.id}`,
          search: params.toString(),
        });
      }

      onCreated?.(txMeta.id);

      return { transactionId: txMeta.id };
    } catch (error) {
      console.error('Failed to create perps withdraw transaction', error);
      return null;
    } finally {
      isInFlightRef.current = false;
      setIsLoading(false);
    }
  }, [
    isLoading,
    location.pathname,
    location.search,
    navigate,
    navigateOnCreate,
    onCreated,
    selectedAccount?.address,
  ]);

  return {
    trigger,
    isLoading,
  };
}
