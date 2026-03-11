import { useMemo } from 'react';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';

const EIP_7702_TRANSACTION_TYPES: TransactionType[] = [
  TransactionType.batch,
  TransactionType.revokeDelegation,
];

/**
 * Returns whether the given transaction is an EIP-7702 transaction (batch,
 * revokeDelegation, or transactions with authorizationList/delegationAddress).
 */
export function useIs7702Transaction(
  transaction: TransactionMeta | undefined,
): boolean {
  return useMemo(() => {
    if (!transaction) {
      return false;
    }
    if (transaction.type && EIP_7702_TRANSACTION_TYPES.includes(transaction.type)) {
      return true;
    }
    const authorizationList = transaction.txParams?.authorizationList;
    if (Array.isArray(authorizationList) && authorizationList.length > 0) {
      return true;
    }
    if (transaction.delegationAddress) {
      return true;
    }
    return false;
  }, [transaction]);
}
