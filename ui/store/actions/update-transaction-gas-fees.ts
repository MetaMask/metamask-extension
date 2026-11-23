import { AnyAction } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { TransactionMeta } from '@metamask/transaction-controller';
import { TxGasFees } from '../../../shared/constants/gas';
import { logErrorWithMessage } from '../../../shared/lib/error';
import { submitRequestToBackground } from '../background-connection';
import type { MetaMaskReduxState } from '../store';

// TODO: Not a thunk, but rather a wrapper around a background call
export function updateTransactionGasFees(
  txId: string,
  txGasFees: Partial<TxGasFees>,
): ThunkAction<
  Promise<TransactionMeta>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async () => {
    let updatedTransaction: TransactionMeta;
    try {
      updatedTransaction = await submitRequestToBackground(
        'TransactionController:updateTransactionGasFees',
        [
          txId,
          // TODO: `userEditedGasLimit` in `TxGasFees` is a string, but the same
          // argument in `TransactionController.updateTransactionGasFees` wants
          // a boolean.
          txGasFees as Omit<Partial<TxGasFees>, 'userEditedGasLimit'> & {
            userEditedGasLimit?: boolean;
          },
        ],
      );
    } catch (error) {
      logErrorWithMessage(error);
      throw error;
    }

    return updatedTransaction;
  };
}
