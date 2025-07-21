import { DecodedTransactionDataResponse } from '../../../../../../shared/types/transaction-decode';
import {
  BackgroundColor,
  TextColor,
} from '../../../../../helpers/constants/design-system';

export function getIsRevokeSetApprovalForAll(
  value: DecodedTransactionDataResponse | undefined,
): boolean {
  const isRevokeSetApprovalForAll =
    value?.data?.[0]?.name === 'setApprovalForAll' &&
    value?.data?.[0]?.params?.[1]?.value === false;

  return isRevokeSetApprovalForAll;
}

export const getAmountColors = (credit?: boolean, debit?: boolean) => {
  let color = TextColor.textDefault;
  let backgroundColor = BackgroundColor.backgroundAlternative;

  if (credit) {
    color = TextColor.successDefault;
    backgroundColor = BackgroundColor.successMuted;
  } else if (debit) {
    color = TextColor.errorDefault;
    backgroundColor = BackgroundColor.errorMuted;
  }
  return { color, backgroundColor };
};
