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
 * Default destination token for Perps Withdraw: last confirmed
 * `perpsWithdraw`'s `metamaskPay`, else native Arbitrum USDC.
 *
 * TODO: replace the hardcoded fallback with the `metamask_pay_tokens`
 * remote flag once exposed in the extension.
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
