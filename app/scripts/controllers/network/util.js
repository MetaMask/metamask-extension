import {
  MAINNET,
  TESTNET,
  MAINNET_CODE,
  TESTNET_CODE,
  MAINNET_DISPLAY_NAME,
  TESTNET_DISPLAY_NAME,
} from './enums'

const networkToNameMap = {
  [MAINNET]: MAINNET_DISPLAY_NAME,
  [MAINNET_CODE]: MAINNET_DISPLAY_NAME,
  [TESTNET]: TESTNET_DISPLAY_NAME,
  [TESTNET_CODE]: TESTNET_DISPLAY_NAME,
}

export const getNetworkDisplayName = (key) => networkToNameMap[key]

export function formatTxMetaForRpcResult (txMeta) {
  return {
    blockHash: txMeta.txReceipt ? txMeta.txReceipt.blockHash : null,
    blockNumber: txMeta.txReceipt ? txMeta.txReceipt.blockNumber : null,
    from: txMeta.txParams.from,
    gas: txMeta.txParams.gas,
    gasPrice: txMeta.txParams.gasPrice,
    storageLimit: txMeta.txParams.storageLimit,
    chainId: txMeta.txParams.chainId,
    epochHeight: txMeta.txParams.epochHeight,
    hash: txMeta.hash,
    input: txMeta.txParams.data || '0x',
    nonce: txMeta.txParams.nonce,
    to: txMeta.txParams.to,
    transactionIndex: txMeta.txReceipt
      ? txMeta.txReceipt.transactionIndex
      : null,
    status: txMeta.txReceipt ? txMeta.txReceipt.outcomeStatus : null,
    value: txMeta.txParams.value || '0x0',
    v: txMeta.v,
    r: txMeta.r,
    s: txMeta.s,
  }
}

export async function getStatus (rpcUrl) {
  const body = JSON.stringify({
    id: 1,
    jsonrpc: '2.0',
    method: 'cfx_getStatus',
    params: [],
  })

  let networkStatus = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body,
  }).catch(() => {})

  if (networkStatus) {
    networkStatus = await networkStatus.json().catch(() => {})
  }

  if (!networkStatus) {
    throw new Error('ConfluxPortal - cfx_getStatus - network error')
  } else if (!networkStatus.result || !networkStatus.result.chainId) {
    return { chainId: '0x1' }
  } else {
    return networkStatus.result
  }
}
