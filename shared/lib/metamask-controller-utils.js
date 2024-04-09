import { TransactionType } from '@metamask/transaction-controller';

export function getTokenValueParam(tokenData = {}) {
  if (tokenData?.name === TransactionType.tokenMethodIncreaseAllowance) {
    return tokenData?.args?.increment?.toString();
  }
  return tokenData?.args?._value?.toString();
}
