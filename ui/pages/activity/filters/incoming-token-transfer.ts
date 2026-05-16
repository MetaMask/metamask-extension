import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { isEqualCaseInsensitive } from '../../../../shared/lib/string-utils';

export function isIncomingTokenTransfer(
  transaction: V1TransactionByHashResponse,
  subjectAddress: string,
) {
  return Boolean(
    transaction.valueTransfers?.some(({ to }) =>
      isEqualCaseInsensitive(to, subjectAddress),
    ) && !isEqualCaseInsensitive(transaction.from, subjectAddress),
  );
}
