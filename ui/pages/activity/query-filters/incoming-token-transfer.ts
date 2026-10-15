import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { isEqualCaseInsensitive as equalsIgnoreCase } from '../../../../shared/lib/string-utils';

export function isIncomingTokenTransfer(
  transaction: V1TransactionByHashResponse,
  subjectAddress: string,
) {
  return Boolean(
    transaction.valueTransfers?.some(({ to }) =>
      equalsIgnoreCase(to, subjectAddress),
    ) && !equalsIgnoreCase(transaction.from, subjectAddress),
  );
}
