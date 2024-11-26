import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { keccak } from 'ethereumjs-util';
import { accountRequiresPublicationDeferral } from '../../../../../shared/modules/selectors';
import { stripHexPrefix } from '../../../../../shared/modules/hexstring-utils';

type updateTransactionMethod = (
  transasctionId: string,
  params: { status: TransactionStatus; hash: string },
) => void;

export const deferPublicationHookFactory = (
  updateTransaction: updateTransactionMethod,
  getMetaMaskState: () => any,
) => {
  return function (transactionMeta: TransactionMeta, rawTx: string) {
    const state = getMetaMaskState();
    const shouldDeferPublication = accountRequiresPublicationDeferral(
      state,
      transactionMeta.txParams.from,
    );

    if (shouldDeferPublication) {
      const rawTxBuffer = Buffer.from(stripHexPrefix(rawTx), 'hex');
      const hash = `0x${keccak(rawTxBuffer).toString('hex')}`;

      // Tell the transaction controller to update the transaction with the hash and mark as submitted, finishing the lifecycle and allowing
      // the block tracker to start watching for the transaction to be mined
      updateTransaction(transactionMeta.id, {
        status: TransactionStatus.submitted,
        hash,
      });
      return false;
    }
    return true;
  };
};

export const beforeCheckPendingTransactionHookFactory = (
  getMetaMaskState: () => any,
) => {
  return function (transactionMeta: TransactionMeta) {
    const state = getMetaMaskState();
    const shouldDeferPublication = accountRequiresPublicationDeferral(
      state,
      transactionMeta.txParams.from,
    );

    if (shouldDeferPublication) {
      return false;
    }
    return true;
  };
};
