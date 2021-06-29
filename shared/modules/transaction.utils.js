import { isHexString } from 'ethereumjs-util';

export function transactionMatchesNetwork(transaction, chainId, networkId) {
  if (typeof transaction.chainId !== 'undefined') {
    return transaction.chainId === chainId;
  }
  return transaction.metamaskNetworkId === networkId;
}

/**
 * Determines if the maxFeePerGas and maxPriorityFeePerGas fields are supplied
 * and valid inputs. This will return false for non hex string inputs.
 * @param {import("../constants/transaction").TransactionMeta} transaction -
 *  the transaction to check
 * @returns {boolean} true if transaction uses valid EIP1559 fields
 */
export function isEIP1559Transaction(transaction) {
  return (
    isHexString(transaction.txParams.maxFeePerGas) &&
    isHexString(transaction.txParams.maxPriorityFeePerGas)
  );
}

/**
 * Determine if the maxFeePerGas and maxPriorityFeePerGas fields are not
 * supplied and that the gasPrice field is valid if it is provided. This will
 * return false if gasPrice is a non hex string.
 * @param {import("../constants/transaction").TransactionMeta} transaction -
 *  the transaction to check
 * @returns {boolean} true if transaction uses valid Legacy fields OR lacks
 *  EIP1559 fields
 */
export function isLegacyTransaction(transaction) {
  return (
    typeof transaction.txParams.maxFeePerGas === 'undefined' &&
    typeof transaction.txParams.maxPriorityFeePerGas === 'undefined' &&
    (typeof transaction.txParams.gasPrice === 'undefined' ||
      isHexString(transaction.txParams.gasPrice))
  );
}
