import { formatTxMetaForRpcResult } from '../util'
import createAsyncMiddleware from 'json-rpc-engine/src/createAsyncMiddleware'

export function createPendingNonceMiddleware ({ getPendingNonce }) {
  return createAsyncMiddleware(async (req, res, next) => {
<<<<<<< HEAD
    const {method, params} = req
    if (method !== 'eth_getTransactionCount') return next()
=======
    const { method, params } = req
    if (method !== 'eth_getTransactionCount') {
      return next()
    }
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
    const [param, blockRef] = params
    if (blockRef !== 'pending') return next()
    res.result = await getPendingNonce(param)
  })
}

export function createPendingTxMiddleware ({ getPendingTransactionByHash }) {
  return createAsyncMiddleware(async (req, res, next) => {
<<<<<<< HEAD
    const {method, params} = req
    if (method !== 'eth_getTransactionByHash') return next()
=======
    const { method, params } = req
    if (method !== 'eth_getTransactionByHash') {
      return next()
    }
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
    const [hash] = params
    const txMeta = getPendingTransactionByHash(hash)
    if (!txMeta) return next()
    res.result = formatTxMetaForRpcResult(txMeta)
  })
}
