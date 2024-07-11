import { TransactionMeta } from '@metamask/transaction-controller';
import { UserOperationControllerState } from '@metamask/user-operation-controller';

export type AccountAbstractionState = {
  confirmTransaction?: { txData?: TransactionMeta };
  metamask: UserOperationControllerState;
};

export function getUserOperations(state: AccountAbstractionState) {
  return state.metamask.userOperations || {};
}

export function getUserOperation(state: AccountAbstractionState) {
  const currentTransaction = state.confirmTransaction?.txData;

  if (!currentTransaction) {
    return undefined;
  }

  const { id, isUserOperation } = currentTransaction;

  if (!isUserOperation) {
    return undefined;
  }

  const userOperations = getUserOperations(state);

  return userOperations[id];
}

export function getIsUsingPaymaster(state: AccountAbstractionState) {
  const userOperation = getUserOperation(state);

  if (!userOperation) {
    return false;
  }

  const paymasterData = userOperation.userOperation?.paymasterAndData;

  return Boolean(paymasterData?.length) && paymasterData !== '0x';
}
