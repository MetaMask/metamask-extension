/* eslint no-unused-vars: 0 */

var params = {
  // diffrent params used in the methods
  param: [],
  blockHashParams: '0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35',
  filterParams: ['0xfe704947a3cd3ca12541458a4321c869'],
  transactionHashParams: [
    '0xbb3a336e3f823ec18197f1e13ee875700f08f03e2cab75f0d0b118dabb44cba0',
  ],
  blockHashAndIndexParams: [
    '0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35',
    '0x0',
  ],
  uncleByBlockNumberAndIndexParams: ['0x29c', '0x0'],
  blockParameterParams: '0x5bad55',
  data: '0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675',
  addressParams: '0xc94770007dda54cF92009BFF0dE90c06F603a09f',
  getStorageAtParams: [
    '0x295a70b2de5e3953354a6a8344e616ed314d7251',
    '0x6661e9d6d8b923d5bbaab1b96e1dd51ff6ea2a93520fdc9eb75d059238b8c5e9',
    '0x65a8db',
  ],
  getCodeParams: ['0x06012c8cf97bead5deae237070f9587f8e7a266d', '0x65a8db'],
  estimateTransaction: {
    from: '0xb60e8dd61c5d32be8058bb8eb970870f07233155',
    to: '0xd46e8dd67c5d32be8058bb8eb970870f07244567',
    gas: '0x76c0',
    gasPrice: '0x9184e72a000',
    value: '0x9184e72a',
    data: '0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675',
  },
  filterGetLogs: [{'blockHash': '0x7c5a35e9cb3e8ae0e221ab470abae9d446c3a5626ce6689fc777dcffcab52c70', 'topics': ['0x241ea03ca20251805084d27d4440371c34a0b85ff108f6bb5611248f73818b80']}],
  block: {
    __required: [],
    number: 'Q',
    hash: 'D32',
    parentHash: 'D32',
    nonce: 'D',
    sha3Uncles: 'D',
    logsBloom: 'D',
    transactionsRoot: 'D',
    stateRoot: 'D',
    receiptsRoot: 'D',
    miner: 'D',
    difficulty: 'Q',
    totalDifficulty: 'Q',
    extraData: 'D',
    size: 'Q',
    gasLimit: 'Q',
    gasUsed: 'Q',
    timestamp: 'Q',
    transactions: ['DATA|Transaction'],
    uncles: ['D'],
  },
  transaction: {
    __required: [],
    hash: 'D32',
    nonce: 'Q',
    blockHash: 'D32',
    blockNumber: 'Q',
    transactionIndex: 'Q',
    from: 'D20',
    to: 'D20',
    value: 'Q',
    gasPrice: 'Q',
    gas: 'Q',
    input: 'D',
  },
  receipt: {
    __required: [],
    transactionHash: 'D32',
    transactionIndex: 'Q',
    blockHash: 'D32',
    blockNumber: 'Q',
    cumulativeGasUsed: 'Q',
    gasUsed: 'Q',
    contractAddress: 'D20',
    logs: ['FilterChange'],
  },

  filterChange: {
    __required: [],
    removed: 'B',
    logIndex: 'Q',
    transactionIndex: 'Q',
    transactionHash: 'D32',
    blockHash: 'D32',
    blockNumber: 'Q',
    address: 'D20',
    data: 'Array|DATA',
    topics: ['D'],
  },
}

var methods = {
  hexaNumberMethods: {
    // these are the methods which have output in the form of hexa decimal numbers
    eth_blockNumber: ['eth_blockNumber', params.param, 'Q'],
    eth_gasPrice: ['eth_gasPrice', params.param, 'Q'],
    eth_newBlockFilter: ['eth_newBlockFilter', params.param, 'Q'],
    eth_newPendingTransactionFilter: [
      'eth_newPendingTransactionFilter',
      params.param,
      'Q',
    ],
    eth_getUncleCountByBlockHash: [
      'eth_getUncleCountByBlockHash',
      [params.blockHashParams],
      'Q',
      1,
    ],
    eth_getBlockTransactionCountByHash: [
      'eth_getBlockTransactionCountByHash',
      [params.blockHashParams],
      'Q',
      1,
    ],
    eth_getTransactionCount: [
      'eth_getTransactionCount',
      [params.addressParams, params.blockParameterParams],
      'Q',
      1,
      2,
    ],
    eth_getBalance: ['eth_getBalance', [params.addressParams, 'latest'], 'Q', 1, 2],
    eth_estimateGas: ['eth_estimateGas', [params.estimateTransaction], 'Q', 1],
    eth_getUncleCountByBlockNumber: [
      'eth_getUncleCountByBlockNumber',
      [params.blockParameterParams],
      'Q',
      1,
    ],
    eth_getBlockTransactionCountByNumber: [
      'eth_getBlockTransactionCountByNumber',
      ['latest'],
      'Q',
      1,
    ],
    eth_protocolVersion: ['eth_protocolVersion', params.param, 'S'],
    eth_getCode: ['eth_getCode', params.getCodeParams, 'D', 1, 2],
  },
  booleanMethods: {
    // these are the methods which have output in the form of boolean
    eth_uninstallFilter: ['eth_uninstallFilter', params.filterParams, 'B', 1],
    eth_mining: ['eth_mining', params.param, 'B'],
    eth_syncing: ['eth_syncing', params.param, 'B|EthSyncing'],
  },
  transactionMethods: {
    // these are the methods which have output in the form of transaction object
    eth_getTransactionByHash: [
      'eth_getTransactionByHash',
      params.transactionHashParams,
      params.transaction,
      1,
    ],
    eth_getTransactionByBlockHashAndIndex: [
      'eth_getTransactionByBlockHashAndIndex',
      params.blockHashAndIndexParams,
      params.transaction,
      2,
    ],
    eth_getTransactionByBlockNumberAndIndex: [
      'eth_getTransactionByBlockNumberAndIndex',
      [params.blockParameterParams, '0x0'],
      params.transaction,
      2,
    ],

  },
  blockMethods: {
    // these are the methods which have output in the form of a block

    eth_getUncleByBlockNumberAndIndex: [
      'eth_getUncleByBlockNumberAndIndex',
      params.uncleByBlockNumberAndIndexParams,
      params.block,
      2,
    ],
    eth_getBlockByHash: [
      'eth_getBlockByHash',
      [params.params, false],
      params.block,
      2,
    ],
    eth_getBlockByNumber: [
      'eth_getBlockByNumber',
      [params.blockParameterParams, false],
      params.block,
      2,
    ],
  },

  methods: {
    // these are the methods which have output in the form of bytes data

    eth_call: ['eth_call', [params.estimateTransaction, 'latest'], 'D', 1, 2],
    eth_getStorageAt: ['eth_getStorageAt', params.getStorageAtParams, 'D', 2, 2],
    eth_getTransactionReceipt: [
      'eth_getTransactionReceipt',
      params.transactionHashParams,
      params.receipt,
      1,
    ],

  },

}

