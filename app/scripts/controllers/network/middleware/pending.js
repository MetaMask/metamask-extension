const { formatTxMetaForRpcResult } = require('../util')
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')

function createPendingNonceMiddleware ({ getPendingNonce }) {
  return createAsyncMiddleware(async (req, res, next) => {
    const {method, params} = req
    if (method !== 'eth_getTransactionCount') {
      return next()
    }
    const [param, blockRef] = params
    if (blockRef !== 'pending') {
      return next()
    }
    res.result = await getPendingNonce(param)
  })
}

function createPendingTxMiddleware ({ getPendingTransactionByHash }) {
  return createAsyncMiddleware(async (req, res, next) => {
    const {method, params} = req
    if (method !== 'eth_getTransactionByHash') {
      return next()
    }
    const [hash] = params
    const txMeta = getPendingTransactionByHash(hash)
    if (!txMeta) {
      return next()
    }
    res.result = formatTxMetaForRpcResult(txMeta)
  })
}

module.exports = {
  createPendingTxMiddleware,
  createPendingNonceMiddleware,
}
