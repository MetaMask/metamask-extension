import {
  TransactionEnvelopeType,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { TransactionGroupStatus } from '../../../shared/constants/transaction';

export function isLegacyTransaction(txParams) {
  return txParams?.type === TransactionEnvelopeType.legacy;
}

/**
 * Returns a status key for a transaction. Requires parsing the txMeta.txReceipt on top of
 * txMeta.status because txMeta.status does not reflect on-chain errors.
 *
 * @param {object} transaction - The txMeta object of a transaction.
 * @param {object} transaction.txReceipt - The transaction receipt.
 * @returns {string}
 */
export function getStatusKey(transaction) {
  const {
    txReceipt: { status: receiptStatus } = {},
    type,
    status,
  } = transaction;

  // There was an on-chain failure
  if (receiptStatus === '0x0') {
    return TransactionStatus.failed;
  }

  if (
    status === TransactionStatus.confirmed &&
    type === TransactionType.cancel
  ) {
    return TransactionGroupStatus.cancelled;
  }

  return transaction.status;
}

/**
 * Returns a title for the given transaction category.
 *
 * This will throw an error if the transaction category is unrecognized and no default is provided.
 *
 * @param {Function} t - The translation function
 * @param {TRANSACTION_TYPES[keyof TRANSACTION_TYPES]} type - The transaction type constant
 * @param {string} nativeCurrency - The native currency of the currently selected network
 * @returns {string} The transaction category title
 */
export function getTransactionTypeTitle(t, type, nativeCurrency = 'ETH') {
  switch (type) {
    case TransactionType.tokenMethodTransfer: {
      return t('transfer');
    }
    case TransactionType.tokenMethodTransferFrom: {
      return t('transferFrom');
    }
    case TransactionType.tokenMethodSafeTransferFrom: {
      return t('safeTransferFrom');
    }
    case TransactionType.tokenMethodApprove: {
      return t('approve');
    }
    case TransactionType.tokenMethodSetApprovalForAll: {
      return t('setApprovalForAll');
    }
    case TransactionType.tokenMethodIncreaseAllowance: {
      return t('approveIncreaseAllowance');
    }
    case TransactionType.simpleSend: {
      return t('sendingNativeAsset', [nativeCurrency]);
    }
    case TransactionType.contractInteraction:
    case TransactionType.batch:
    case TransactionType.revokeDelegation: {
      return t('contractInteraction');
    }
    case TransactionType.deployContract: {
      return t('contractDeployment');
    }
    case TransactionType.swap: {
      return t('swap');
    }
    case TransactionType.swapAndSend: {
      return t('swapAndSend');
    }
    case TransactionType.swapApproval: {
      return t('swapApproval');
    }
    default: {
      throw new Error(`Unrecognized transaction type: ${type}`);
    }
  }
}
