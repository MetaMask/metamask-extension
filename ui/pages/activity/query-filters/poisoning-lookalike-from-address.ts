import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { findSimilarAddresses } from '@metamask/phishing-controller';
import { isEqualCaseInsensitive as equalsIgnoreCase } from '../../../../shared/lib/string-utils';

export function isPoisoningLookalikeFromAddress(
  transaction: V1TransactionByHashResponse,
  subjectAddress: string,
  knownAddresses: readonly string[],
) {
  if (equalsIgnoreCase(transaction.from, subjectAddress)) {
    return false;
  }

  const fromAddress = transaction.from;
  if (!fromAddress || knownAddresses.length === 0) {
    return false;
  }

  return findSimilarAddresses(fromAddress, [...knownAddresses]).length > 0;
}
