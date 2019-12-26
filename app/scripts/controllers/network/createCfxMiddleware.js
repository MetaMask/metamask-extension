const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')

module.exports = { createCfxRewriteRequestMiddleware }

const MethodsWithDefaultEpochParameter = {
  cfx_getTransactionCount: 1,
  cfx_getBalance: 1,
  cfx_getBlockByEpochNumber: 0,
  cfx_epochNumber: 0,
  cfx_getBlocksByEpoch: 0,
}

function createCfxRewriteRequestMiddleware () {
  // eslint-disable-next-line no-unused-vars
  return createAsyncMiddleware(async (req, res, next) => {
    // if (req) {
    //   console.log('conflux_debug', req.method)
    // }
    if (req && req.method) {
      req.method = req.method.replace('eth_', 'cfx_')
      req.method = req.method.replace(
        'getBlockByNumber',
        'getBlockByEpochNumber'
      )
      req.method = req.method.replace('cfx_blockNumber', 'cfx_epochNumber')
    }
    if (
      MethodsWithDefaultEpochParameter[req.method] !== undefined &&
      (!Array.isArray(req.params) ||
        req.params[MethodsWithDefaultEpochParameter[req.method]] ===
          undefined ||
        req.params[MethodsWithDefaultEpochParameter[req.method]] ===
          'latest_mined')
    ) {
      if (!Array.isArray(req.params)) {
        req.params = []
      }
      req.params[MethodsWithDefaultEpochParameter[req.method]] = 'latest_state'
    }

    await next()
  })
}
