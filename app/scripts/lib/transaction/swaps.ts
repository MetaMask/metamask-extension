import { pickBy, merge } from 'lodash';
import {
  TransactionStatus,
  TransactionType,
  TransactionMeta,
} from '../../../../shared/constants/transaction';
import MetamaskController from '../../metamask-controller';

type SwapOptions = {
  // Whether this transaction required an approval transaction
  hasApproveTx: boolean;
  // Additional metadata to store for the transaction
  meta: any;
};

type SwapApprovalTransaction = {
  sourceTokenSymbol: string;
  destinationTokenSymbol: string;
  type: TransactionType;
  destinationTokenDecimals: string;
  destinationTokenAddress: string;
  swapMetaData: string;
  swapTokenValue: string;
  estimatedBaseFee: string;
  approvalTxId: string;
};

/**
 * Creates a new transaction with swap-specific metadata
 *
 * @param {SwapOptions} swapOptions - Swap-specific options
 * @param {TransactionType} transactionType - The type of transaction
 * @param {TransactionMeta} transactionMeta - The transaction metadata
 * @returns {Promise<TransactionMeta>} The updated transaction metadata
 */
export async function createSwapsTransaction(
  this: MetamaskController,
  swapOptions: SwapOptions,
  transactionType: TransactionType,
  transactionMeta: TransactionMeta,
) {
  if (
    transactionType === TransactionType.swap &&
    swapOptions?.hasApproveTx === false &&
    transactionMeta.simulationFails
  ) {
    await this.txController.cancelTransaction(transactionMeta.id);
    throw new Error('Simulation failed');
  }

  const swapsMeta = swapOptions?.meta;

  if (!swapsMeta) {
    return transactionMeta;
  }

  if (transactionType === TransactionType.swapApproval) {
    this.swapsController.setApproveTxId(transactionMeta.id);
    throwErrorIfNotUnapprovedTx(transactionMeta);

    const swapApprovalTransaction = pickBy({
      type: swapsMeta.type,
      sourceTokenSymbol: swapsMeta.sourceTokenSymbol,
    }) as SwapApprovalTransaction;

    const finalTransactionMeta = merge(
      transactionMeta,
      swapApprovalTransaction,
    );

    await this.txController.updateTransactionSwapProperties(
      finalTransactionMeta.id,
      swapApprovalTransaction,
    );

    return finalTransactionMeta;
  }

  if (transactionType === TransactionType.swap) {
    this.swapsController.setTradeTxId(transactionMeta.id);
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
    }) as SwapApprovalTransaction;

    const finalTransactionMeta = merge(
      transactionMeta,
      swapApprovalTransaction,
    );

    await this.txController.updateTransactionSwapProperties(
      finalTransactionMeta.id,
      swapApprovalTransaction,
    );

    return finalTransactionMeta;
  }

  return transactionMeta;
}

function throwErrorIfNotUnapprovedTx(transactionMeta: TransactionMeta) {
  if (!isUnapprovedTransaction(transactionMeta)) {
    throw new Error(
      `TransactionsController: Can only call createSwapsTransaction on an unapproved transaction.
         Current tx status: ${transactionMeta.status}`,
    );
  }
}

function isUnapprovedTransaction(transactionMeta: TransactionMeta) {
  return transactionMeta.status === TransactionStatus.unapproved;
}
