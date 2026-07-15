import { createSelector } from 'reselect';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { selectTransactions } from './transactionController';

function hasSeparateMetamaskPaySourceHash(
  tx: Pick<TransactionMeta, 'hash' | 'metamaskPay'>,
) {
  const { hash, metamaskPay } = tx;
  return Boolean(
    metamaskPay?.isPostQuote &&
    hash &&
    metamaskPay.sourceHash &&
    hash.toLowerCase() !== metamaskPay.sourceHash.toLowerCase(),
  );
}

export function isPerpsWithdrawExtraTransaction(
  tx: Pick<TransactionMeta, 'type' | 'hash' | 'metamaskPay'>,
) {
  return (
    tx.type === TransactionType.perpsWithdraw &&
    hasSeparateMetamaskPaySourceHash(tx)
  );
}

const selectMetamaskPayByHash = createSelector(
  selectTransactions,
  (transactions) => {
    const result = new Map<string, TransactionMeta['metamaskPay']>();

    for (const tx of transactions) {
      if (
        tx.hash &&
        (tx.metamaskPay?.totalFiat || tx.metamaskPay?.targetFiat)
      ) {
        result.set(tx.hash.toLowerCase(), tx.metamaskPay);
      }
    }

    return result;
  },
);

export const selectPerpsWithdrawMetamaskPayByHash = createSelector(
  selectTransactions,
  selectMetamaskPayByHash,
  (transactions, metamaskPayByHash) => {
    const result = new Map(metamaskPayByHash);

    for (const tx of transactions) {
      if (
        tx.type !== TransactionType.perpsWithdraw ||
        !hasSeparateMetamaskPaySourceHash(tx) ||
        !tx.metamaskPay
      ) {
        continue;
      }

      const from = tx.txParams?.from?.toLowerCase();
      const data = tx.txParams?.data?.toLowerCase();
      if (!from || !data) {
        continue;
      }

      for (const other of transactions) {
        if (
          other.type === TransactionType.perpsWithdraw &&
          other.hash &&
          other.txParams?.from?.toLowerCase() === from &&
          other.txParams?.data?.toLowerCase() === data
        ) {
          result.set(other.hash.toLowerCase(), tx.metamaskPay);
        }
      }
    }

    return result;
  },
);
