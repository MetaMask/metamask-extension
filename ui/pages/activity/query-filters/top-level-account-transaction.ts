import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { isEqualCaseInsensitive as equalsIgnoreCase } from '../../../../shared/lib/string-utils';

export function isTopLevelAccountTransaction(
  transaction: V1TransactionByHashResponse,
  subjectAddress: string,
) {
  return (
    equalsIgnoreCase(transaction.from, subjectAddress) ||
    equalsIgnoreCase(transaction.to, subjectAddress)
  );
}
