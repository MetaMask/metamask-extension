import type { V5TransactionRecord } from '@metamask/core-backend';
import { isEqualCaseInsensitive as equalsIgnoreCase } from '../../../../shared/lib/string-utils';

export function isZeroValueSelfSend(
  transaction: V5TransactionRecord,
  subjectAddress: string,
) {
  const { tx, valueTransfers } = transaction;

  return (
    equalsIgnoreCase(tx.from, subjectAddress) &&
    equalsIgnoreCase(tx.to ?? '', subjectAddress) &&
    tx.value === '0' &&
    !valueTransfers.length &&
    (!tx.methodId || tx.methodId === '0x')
  );
}
