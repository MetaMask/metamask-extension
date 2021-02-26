export function transactionMatchesNetwork(transaction, chainId, networkId) {
  if (typeof transaction.chainId !== 'undefined') {
    return transaction.chainId === chainId;
  }
  return transaction.metamaskNetworkId === networkId;
}
