import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { isEqualCaseInsensitive as equalsIgnoreCase } from '../../../../shared/lib/string-utils';
import { parseValueTransfers } from '../../../../shared/lib/multichain/transformations';
import { NATIVE_TOKEN_ADDRESS } from '../../../../shared/constants/transaction';

export function isIncomingNativeAssetTransfer(
  transaction: V1TransactionByHashResponse,
  subjectAddress: string,
) {
  const { to, from } = parseValueTransfers(subjectAddress, transaction);

  return (
    !equalsIgnoreCase(transaction.from, subjectAddress) &&
    !from &&
    to?.token.address === NATIVE_TOKEN_ADDRESS
  );
}
