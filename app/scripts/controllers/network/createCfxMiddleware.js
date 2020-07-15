const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')

module.exports = { createCfxRewriteRequestMiddleware, alterRpcMethodAndParams }

const MethodsWithDefaultEpochParameter = {
  cfx_getNextNounce: 1,
  cfx_getBalance: 1,
  cfx_getBlockByEpochNumber: 0,
  cfx_epochNumber: 0,
  cfx_getBlocksByEpoch: 0,
  cfx_call: 1,
}

function alterRpcMethodAndParams ({ method = '', params = {} } = {}) {
  if (method) {
    method = method.replace('eth_', 'cfx_')
    method = method.replace('getTransactionCount', 'getNextNonce')
    method = method.replace(/estimateGas$/, 'estimateGasAndCollateral')
    method = method.replace('getBlockByNumber', 'getBlockByEpochNumber')
    method = method.replace('cfx_blockNumber', 'cfx_epochNumber')
  }
  if (
    MethodsWithDefaultEpochParameter[method] !== undefined &&
    (!Array.isArray(params) ||
      params[MethodsWithDefaultEpochParameter[method]] === undefined ||
      params[MethodsWithDefaultEpochParameter[method]] === 'latest_mined' ||
      params[MethodsWithDefaultEpochParameter[method]] === 'latest')
  ) {
    if (!Array.isArray(params)) {
      params = []
    }
    params[MethodsWithDefaultEpochParameter[method]] = 'latest_state'
  }

  return { method, params }
}

function createCfxRewriteRequestMiddleware () {
  // eslint-disable-next-line no-unused-vars
  return createAsyncMiddleware(async (req, res, next) => {
    if (req) {
      const { method, params } = alterRpcMethodAndParams(req)
      req.method = method
      req.params = params
    }

    await next()
  })
}
