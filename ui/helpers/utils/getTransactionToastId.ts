export function getEvmTransactionToastId(transactionId: string) {
  return `tx-${transactionId}`;
}

export function getNonEvmTransactionToastId(transactionId: string) {
  return `non-evm-tx-${transactionId}`;
}

export function getBridgeTransactionToastId({
  approvalId,
  txId,
}: {
  approvalId: string;
  txId?: string;
}) {
  return txId
    ? getEvmTransactionToastId(txId)
    : `bridge-tx-${approvalId}`;
}
