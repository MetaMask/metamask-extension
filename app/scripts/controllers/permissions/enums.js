export const WALLET_PREFIX = 'wallet_'

export const HISTORY_STORE_KEY = 'permissionsHistory'

export const LOG_STORE_KEY = 'permissionsLog'

export const METADATA_STORE_KEY = 'domainMetadata'

export const METADATA_CACHE_MAX_SIZE = 100

export const CAVEAT_NAMES = {
  exposedAccounts: 'exposedAccounts',
  primaryAccountOnly: 'primaryAccountOnly',
}

export const CAVEAT_TYPES = {
  limitResponseLength: 'limitResponseLength',
  filterResponse: 'filterResponse',
}

export const NOTIFICATION_NAMES = {
  accountsChanged: 'wallet_accountsChanged',
}

export const LOG_IGNORE_METHODS = ['wallet_sendDomainMetadata']

export const LOG_METHOD_TYPES = {
  restricted: 'restricted',
  internal: 'internal',
}

export const LOG_LIMIT = 100

export const SAFE_METHODS = [
  'web3_sha3',
  'web3_clientVersion',
  'net_listening',
  'net_peerCount',
  'net_version',
  'eth_blockNumber',
  'eth_call',
  'eth_chainId',
  'eth_coinbase',
  'eth_estimateGas',
  'eth_gasPrice',
  'eth_getBalance',
  'eth_getBlockByHash',
  'eth_getBlockByNumber',
  'eth_getBlockTransactionCountByHash',
  'eth_getBlockTransactionCountByNumber',
  'eth_getCode',
  'eth_getFilterChanges',
  'eth_getFilterLogs',
  'eth_getLogs',
  'eth_getStorageAt',
  'eth_getTransactionByBlockHashAndIndex',
  'eth_getTransactionByBlockNumberAndIndex',
  'eth_getTransactionByHash',
  'eth_getTransactionCount',
  'eth_getTransactionReceipt',
  'eth_getUncleByBlockHashAndIndex',
  'eth_getUncleByBlockNumberAndIndex',
  'eth_getUncleCountByBlockHash',
  'eth_getUncleCountByBlockNumber',
  'eth_getWork',
  'eth_hashrate',
  'eth_mining',
  'eth_newBlockFilter',
  'eth_newFilter',
  'eth_newPendingTransactionFilter',
  'eth_protocolVersion',
  'eth_sendRawTransaction',
  'eth_sendTransaction',
  'eth_sign',
  'personal_sign',
  'personal_ecRecover',
  'eth_signTypedData',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'eth_submitHashrate',
  'eth_submitWork',
  'eth_syncing',
  'eth_uninstallFilter',
  'metamask_watchAsset',
  'wallet_watchAsset',
  'eth_getEncryptionPublicKey',
  'eth_decrypt',
]
