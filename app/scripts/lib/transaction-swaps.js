import { pickBy, merge } from 'lodash';
import {
  TransactionStatus,
  TransactionType,
} from '../../../shared/constants/transaction';

export const createSwapsTransaction =
  ({
    cancelTransaction,
    setApproveTxId,
    updateTransactionSwapProperties,
    setTradeTxId,
  }) =>
  async (swapOptions, transactionType, transactionMeta) => {
    if (
      transactionType === TransactionType.swap &&
      swapOptions?.hasApproveTx === false &&
      transactionMeta.simulationFails
    ) {
      await cancelTransaction(transactionMeta.id);
      throw new Error('Simulation failed');
    }

    const swapsMeta = swapOptions?.meta;

    if (!swapsMeta) {
      return transactionMeta;
    }

    if (transactionType === TransactionType.swapApproval) {
      setApproveTxId(transactionMeta.id);
      throwErrorIfNotUnapprovedTx(transactionMeta);

      const swapApprovalTransaction = pickBy({
        type: swapsMeta.type,
        sourceTokenSymbol: swapsMeta.sourceTokenSymbol,
      });
      const finalTransactionMeta = merge(
        transactionMeta,
        swapApprovalTransaction,
      );

      await updateTransactionSwapProperties(finalTransactionMeta);

      return finalTransactionMeta;
    }

    if (transactionType === TransactionType.swap) {
      setTradeTxId(transactionMeta.id);
      throwErrorIfNotUnapprovedTx(transactionMeta);

      const swapApprovalTransaction = pickBy({
        sourceTokenSymbol: swapsMeta.sourceTokenSymbol,
        destinationTokenSymbol: swapsMeta.destinationTokenSymbol,
        type: swapsMeta.type,
        destinationTokenDecimals: swapsMeta.destinationTokenDecimals,
        destinationTokenAddress: swapsMeta.destinationTokenAddress,
        swapMetaData: swapsMeta.swapMetaData,
        swapTokenValue: swapsMeta.swapTokenValue,
        estimatedBaseFee: swapsMeta.estimatedBaseFee,
        approvalTxId: swapsMeta.approvalTxId,
      });
      const finalTransactionMeta = merge(
        transactionMeta,
        swapApprovalTransaction,
      );

      await updateTransactionSwapProperties(finalTransactionMeta);

      return finalTransactionMeta;
    }

    return transactionMeta;
  };

function throwErrorIfNotUnapprovedTx(transactionMeta) {
  if (!isUnapprovedTransaction(transactionMeta)) {
    throw new Error(
      `TransactionsController: Can only call createSwapsTransaction on an unapproved transaction.
         Current tx status: ${transactionMeta.status}`,
    );
  }
}

function isUnapprovedTransaction(transactionMeta) {
  return transactionMeta.status === TransactionStatus.unapproved;
}
