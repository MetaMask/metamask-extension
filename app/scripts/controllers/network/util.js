import { NETWORK_TO_NAME_MAP } from '../../../../shared/constants/network';
import { TRANSACTION_ENVELOPE_TYPES } from '../../../../shared/constants/transaction';
import { HEX_ZERO_VALUE } from '../../../../shared/constants/hex-values';

export const getNetworkDisplayName = (key) => NETWORK_TO_NAME_MAP[key];

export function formatTxMetaForRpcResult(txMeta) {
  const { r, s, v, hash, txReceipt, txParams } = txMeta;
  const {
    to,
    data,
    nonce,
    gas,
    from,
    value,
    gasPrice,
    accessList,
    maxFeePerGas,
    maxPriorityFeePerGas,
  } = txParams;

  const formattedTxMeta = {
    v,
    r,
    s,
    to,
    gas,
    from,
    hash,
    nonce,
    input: data || '0x',
    value: value || HEX_ZERO_VALUE,
    accessList: accessList || null,
    blockHash: txReceipt?.blockHash || null,
    blockNumber: txReceipt?.blockNumber || null,
    transactionIndex: txReceipt?.transactionIndex || null,
  };

  if (maxFeePerGas && maxPriorityFeePerGas) {
    formattedTxMeta.gasPrice = maxFeePerGas;
    formattedTxMeta.maxFeePerGas = maxFeePerGas;
    formattedTxMeta.maxPriorityFeePerGas = maxPriorityFeePerGas;
    formattedTxMeta.type = TRANSACTION_ENVELOPE_TYPES.FEE_MARKET;
  } else {
    formattedTxMeta.gasPrice = gasPrice;
    formattedTxMeta.type = TRANSACTION_ENVELOPE_TYPES.LEGACY;
  }

  return formattedTxMeta;
}
