import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import {
  selectTransactions,
  type TransactionState,
} from '../../../../selectors/transactionController';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import { ARBITRUM_USDC } from '../../constants/perps';
import type { SetPayTokenRequest } from './types';

/**
 * Returns the default Perps withdraw destination token for the Pay With pill.
 *
 * Selection order (mirrors metamask-mobile#27532):
 * 1. Last token used for a confirmed `perpsWithdraw` transaction (read from
 * `metamaskPay` on `TransactionController.transactions`, including nested
 * transactions via the shared `hasTransactionType` helper). Lets the user
 * re-use their previous selection across sessions without us persisting
 * extra state.
 * 2. Fallback to native Arbitrum USDC.
 *
 * TODO: Once the extension exposes a `metamask_pay_tokens` remote feature
 * flag (see mobile's `selectMetaMaskPayTokensFlags.preferredTokens.overrides
 * .perpsWithdraw`), use that as the fallback instead of the hardcoded
 * `ARBITRUM_USDC` so default tokens can be tuned without a release.
 */
export function usePerpsWithdrawDefaultToken(): SetPayTokenRequest {
  const transactions = useSelector((state: TransactionState) =>
    selectTransactions(state),
  );

  const lastUsed = useMemo(() => {
    const matching = transactions.filter(
      (tx) =>
        tx.status === TransactionStatus.confirmed &&
        hasTransactionType(tx, [TransactionType.perpsWithdraw]) &&
        Boolean(tx.metamaskPay?.tokenAddress) &&
        Boolean(tx.metamaskPay?.chainId),
    );

    if (matching.length === 0) {
      return undefined;
    }

    const latest = matching.reduce((acc, tx) => (tx.time > acc.time ? tx : acc));

    return {
      address: latest.metamaskPay?.tokenAddress as Hex,
      chainId: latest.metamaskPay?.chainId as Hex,
    };
  }, [transactions]);

  if (lastUsed) {
    return lastUsed;
  }

  return {
    address: ARBITRUM_USDC.address,
    chainId: ARBITRUM_USDC.chainId,
  };
}
