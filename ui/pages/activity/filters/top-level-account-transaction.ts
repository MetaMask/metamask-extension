import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { isEqualCaseInsensitive } from '../../../../shared/lib/string-utils';

export function isTopLevelAccountTransaction(
  transaction: V1TransactionByHashResponse,
  subjectAddress: string,
) {
  return (
    isEqualCaseInsensitive(transaction.from, subjectAddress) ||
    isEqualCaseInsensitive(transaction.to, subjectAddress)
  );
}
