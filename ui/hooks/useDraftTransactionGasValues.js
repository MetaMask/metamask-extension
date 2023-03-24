import { useSelector } from 'react-redux';
import { getCurrentDraftTransaction } from '../ducks/send';
import { getUnapprovedTransactions } from '../selectors';

export const useDraftTransactionGasValues = () => {
  const draftTransaction = useSelector(getCurrentDraftTransaction);
  const unapprovedTxs = useSelector(getUnapprovedTransactions);

  let transactionData = {};
  if (Object.keys(draftTransaction).length !== 0) {
    const editingTransaction = unapprovedTxs[draftTransaction.id];
    transactionData = {
      txParams: {
        gasPrice: draftTransaction.gas?.gasPrice,
        gas: editingTransaction?.userEditedGasLimit
          ? editingTransaction?.txParams?.gas
          : draftTransaction.gas?.gasLimit,
        maxFeePerGas: editingTransaction?.txParams?.maxFeePerGas
          ? editingTransaction?.txParams?.maxFeePerGas
          : draftTransaction.gas?.maxFeePerGas,
        maxPriorityFeePerGas: editingTransaction?.txParams?.maxPriorityFeePerGas
          ? editingTransaction?.txParams?.maxPriorityFeePerGas
          : draftTransaction.gas?.maxPriorityFeePerGas,
        value: draftTransaction.amount?.value,
        type: draftTransaction.transactionType,
      },
      userFeeLevel: editingTransaction?.userFeeLevel,
    };
  }

  return { transactionData };
};
