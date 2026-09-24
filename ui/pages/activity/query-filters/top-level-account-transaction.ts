import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import {
  isCaipAccountId,
  parseCaipAccountId,
  type CaipAccountId,
} from '@metamask/utils';
import { isEqualCaseInsensitive as equalsIgnoreCase } from '../../../../shared/lib/string-utils';

type TransactionWithAccountId = V1TransactionByHashResponse & {
  accountId?: CaipAccountId;
};

export function isTopLevelAccountTransaction(
  transaction: V1TransactionByHashResponse,
  subjectAddress: string,
) {
  const { accountId } = transaction as TransactionWithAccountId;
  const accountAddress =
    accountId && isCaipAccountId(accountId)
      ? parseCaipAccountId(accountId).address
      : '';

  return (
    equalsIgnoreCase(transaction.from, subjectAddress) ||
    equalsIgnoreCase(transaction.to, subjectAddress) ||
    equalsIgnoreCase(accountAddress, subjectAddress)
  );
}
