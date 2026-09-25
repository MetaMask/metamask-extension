import type { TransactionMeta } from '@metamask/transaction-controller';

type MoneyBatchEntry = {
  childIds: Set<string>;
};

const moneyBatchesByParentId = new Map<string, MoneyBatchEntry>();

export function registerMoneyBatchTransaction(
  transactionMeta: Pick<TransactionMeta, 'id' | 'requiredTransactionIds'>,
) {
  const { id, requiredTransactionIds } = transactionMeta;
  if (!id) {
    return;
  }

  let entry = moneyBatchesByParentId.get(id);
  if (!entry) {
    entry = { childIds: new Set() };
    moneyBatchesByParentId.set(id, entry);
  }

  for (const childId of requiredTransactionIds ?? []) {
    entry.childIds.add(childId);
  }
}

export function registerMoneyBatchById(transactionId: string | undefined) {
  if (!transactionId) {
    return;
  }
  if (!moneyBatchesByParentId.has(transactionId)) {
    moneyBatchesByParentId.set(transactionId, { childIds: new Set() });
  }
}

export function clearMoneyBatchById(transactionId: string | undefined) {
  if (!transactionId) {
    return;
  }
  moneyBatchesByParentId.delete(transactionId);
}

export function clearMoneyBatchTransaction(
  transactionMeta: Pick<TransactionMeta, 'id'>,
) {
  clearMoneyBatchById(transactionMeta.id);
}

export function isMoneyBatchInFlight() {
  return moneyBatchesByParentId.size > 0;
}

export function isKnownMoneyBatchChild(id: string) {
  for (const entry of moneyBatchesByParentId.values()) {
    if (entry.childIds.has(id)) {
      return true;
    }
  }
  return false;
}

export function resetMoneyBatchRegistry() {
  moneyBatchesByParentId.clear();
}
