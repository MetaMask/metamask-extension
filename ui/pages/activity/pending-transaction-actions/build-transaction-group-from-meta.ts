import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { PRIORITY_STATUS_HASH } from '../../../helpers/constants/transactions';
import type { TransactionGroup } from '../../../../shared/lib/multichain/types';

function getNonceNetworkKey(transaction: TransactionMeta) {
  return `${transaction.txParams?.nonce ?? ''}-${transaction.networkClientId}`;
}

/**
 * Derives nonce-group flags from live controller metas (same rules as
 * groupAndSortTransactionsByNonce).
 *
 * @param meta - Transaction meta for the row's primary transaction.
 * @param transactions - All transaction metas from the controller.
 */
export const deriveNonceGroupFlags = (
  meta: TransactionMeta,
  transactions: TransactionMeta[],
): { hasCancelled: boolean; hasRetried: boolean } => {
  const key = getNonceNetworkKey(meta);
  let hasCancelled = false;
  let hasRetried = false;

  for (const transaction of transactions) {
    if (getNonceNetworkKey(transaction) !== key) {
      continue;
    }

    const { status, type } = transaction;
    const inPriorityStatus = status in PRIORITY_STATUS_HASH;
    const isDropped = status === TransactionStatus.dropped;

    if (type === TransactionType.retry && (inPriorityStatus || isDropped)) {
      hasRetried = true;
    }

    if (type === TransactionType.cancel && (inPriorityStatus || isDropped)) {
      hasCancelled = true;
    }
  }

  return { hasCancelled, hasRetried };
};

/**
 * Minimal transaction group for pending-action hooks (no `raw` on activity rows).
 *
 * @param meta - Transaction meta for the row's primary transaction.
 * @param transactions - All transaction metas from the controller.
 */
export const buildTransactionGroupFromMeta = (
  meta: TransactionMeta,
  transactions: TransactionMeta[],
): TransactionGroup => {
  const key = getNonceNetworkKey(meta);
  const siblings = transactions.filter(
    (transaction) => getNonceNetworkKey(transaction) === key,
  );
  const { hasCancelled, hasRetried } = deriveNonceGroupFlags(
    meta,
    transactions,
  );
  const nonce = (meta.txParams?.nonce ?? '0x0') as Hex;

  return {
    transactions: siblings.length > 0 ? siblings : [meta],
    initialTransaction: meta,
    primaryTransaction: meta,
    nonce,
    hasCancelled,
    hasRetried,
  };
};
