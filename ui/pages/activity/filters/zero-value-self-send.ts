import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { isEqualCaseInsensitive } from '../../../../shared/lib/string-utils';

export function isZeroValueSelfSend(
  transaction: V1TransactionByHashResponse,
  subjectAddress: string,
) {
  return (
    isEqualCaseInsensitive(transaction.from, subjectAddress) &&
    isEqualCaseInsensitive(transaction.to, subjectAddress) &&
    transaction.value === '0' &&
    !transaction.valueTransfers?.length &&
    (!transaction.methodId || transaction.methodId === '0x')
  );
}
