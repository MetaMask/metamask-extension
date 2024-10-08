import { DecodedTransactionDataResponse } from '../../../../../../shared/types/transaction-decode';

export function getIsRevokeSetApprovalForAll(
  value: DecodedTransactionDataResponse | undefined,
): boolean {
  const isRevokeSetApprovalForAll =
    value?.data?.[0]?.name === 'setApprovalForAll' &&
    value?.data?.[0]?.params?.[1]?.value === false;

  return isRevokeSetApprovalForAll;
}
