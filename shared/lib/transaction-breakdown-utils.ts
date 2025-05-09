import { TransactionMeta } from '@metamask/transaction-controller';
// eslint-disable-next-line import/no-restricted-paths
import { getHexGasTotal } from '../../ui/helpers/utils/confirm-tx.util';

/**
 * Calculates the total cost of a transaction in hex wei.
 *
 * @param txMeta - The transaction meta object.
 * @returns The total cost of the transaction in hex wei.
 */
export const calcHexGasTotal = (txMeta: TransactionMeta) => {
  const {
    txParams: { gas, gasPrice } = {},
    txReceipt: { gasUsed, effectiveGasPrice } = {},
  } = txMeta;
  const gasLimit = typeof gasUsed === 'string' ? gasUsed : gas;

  // To calculate the total cost of the transaction, we use gasPrice if it is in the txParam,
  // which will only be the case on non-EIP1559 networks. If it is not in the params, we can
  // use the effectiveGasPrice from the receipt, which will ultimately represent to true cost
  // of the transaction. Either of these are used the same way with gasLimit to calculate total
  // cost. effectiveGasPrice will be available on the txReciept for all EIP1559 networks
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const usedGasPrice = gasPrice || effectiveGasPrice;
  const hexGasTotal =
    (gasLimit &&
      usedGasPrice &&
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      getHexGasTotal({ gasLimit, gasPrice: usedGasPrice })) ||
    '0x0';

  return hexGasTotal;
};
