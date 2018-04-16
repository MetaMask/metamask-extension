const log = require('loglevel')

// log rpc activity
module.exports = createLoggerMiddleware

function createLoggerMiddleware ({ origin }) {
  return function loggerMiddleware (req, res, next, end) {
    next((cb) => {
      if (res.error) {
        log.error('Error in RPC response:\n', res)
      }
      if (req.isMetamaskInternal) return
      log.info(`RPC (${origin}):`, req, '->', res)
      cb()
    })
  }
}
