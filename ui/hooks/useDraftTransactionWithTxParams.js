import { useSelector } from 'react-redux';
import { getCurrentDraftTransaction } from '../ducks/send';
import { getUnapprovedTransactions } from '../selectors';

/**
 * Returns an object that resembles the txData.txParams from the Transactions state.
 * While processing gas details for send transaction and edit transaction,
 * the gas data from draftTransaction and unapprovedTx has to be reorganized
 * to mimic the txdata.txParam from a confirmTransaction
 *
 * @returns {object} The transaction data
 */
export const useDraftTransactionWithTxParams = () => {
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

  return transactionData;
};
