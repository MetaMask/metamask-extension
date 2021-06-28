import { NETWORK_TO_NAME_MAP } from '../../../../shared/constants/network';
import { isEIP1559Transaction } from '../../../../shared/modules/transaction.utils';

export const getNetworkDisplayName = (key) => NETWORK_TO_NAME_MAP[key];

export function formatTxMetaForRpcResult(txMeta) {
  const commonFields = {
    blockHash: txMeta.txReceipt ? txMeta.txReceipt.blockHash : null,
    blockNumber: txMeta.txReceipt ? txMeta.txReceipt.blockNumber : null,
    from: txMeta.txParams.from,
    gas: txMeta.txParams.gas,
    hash: txMeta.hash,
    input: txMeta.txParams.data || '0x',
    nonce: txMeta.txParams.nonce,
    to: txMeta.txParams.to,
    transactionIndex: txMeta.txReceipt
      ? txMeta.txReceipt.transactionIndex
      : null,
    value: txMeta.txParams.value || '0x0',
    v: txMeta.v,
    r: txMeta.r,
    s: txMeta.s,
  };

  if (isEIP1559Transaction(txMeta)) {
    return {
      ...commonFields,
      maxFeePerGas: txMeta.txParams.maxFeePerGas,
      maxPriorityFeePerGas: txMeta.txParams.maxPriorityFeePerGas,
    };
  }
  return {
    ...commonFields,
    gasPrice: txMeta.txParams.gasPrice,
  };
}
