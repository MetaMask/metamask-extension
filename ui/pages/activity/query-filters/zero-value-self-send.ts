import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { isEqualCaseInsensitive as equalsIgnoreCase } from '../../../../shared/lib/string-utils';

export function isZeroValueSelfSend(
  transaction: V1TransactionByHashResponse,
  subjectAddress: string,
) {
  return (
    equalsIgnoreCase(transaction.from, subjectAddress) &&
    equalsIgnoreCase(transaction.to, subjectAddress) &&
    transaction.value === '0' &&
    !transaction.valueTransfers?.length &&
    (!transaction.methodId || transaction.methodId === '0x')
  );
}
