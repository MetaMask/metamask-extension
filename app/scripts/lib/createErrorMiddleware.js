const log = require('loglevel')

/**
 * JSON-RPC error object
 *
 * @typedef {Object} RpcError
 * @property {number} code - Indicates the error type that occurred
 * @property {Object} [data] - Contains additional information about the error
 * @property {string} [message] - Short description of the error
 */

/**
 * Middleware configuration object
 *
 * @typedef {Object} MiddlewareConfig
 * @property {boolean} [override] - Use RPC_ERRORS message in place of provider message
 */

/**
 * Map of standard and non-standard RPC error codes to messages
 */
const RPC_ERRORS = {
  1: 'An unauthorized action was attempted.',
  2: 'A disallowed action was attempted.',
  3: 'An execution error occurred.',
  [-32600]: 'The JSON sent is not a valid Request object.',
  [-32601]: 'The method does not exist / is not available.',
  [-32602]: 'Invalid method parameter(s).',
  [-32603]: 'Internal JSON-RPC error.',
  [-32700]: 'Invalid JSON was received by the server. An error occurred on the server while parsing the JSON text.',
  internal: 'Internal server error.',
  unknown: 'Unknown JSON-RPC error.',
}

/**
 * Modifies a JSON-RPC error object in-place to add a human-readable message,
 * optionally overriding any provider-supplied message
 *
 * @param {RpcError} error - JSON-RPC error object
 * @param {boolean} override - Use RPC_ERRORS message in place of provider message
 */
function sanitizeRPCError (error, override) {
  if (error.message && !override) { return error }
  const message = error.code > -31099 && error.code < -32100 ? RPC_ERRORS.internal : RPC_ERRORS[error.code]
  error.message = message || RPC_ERRORS.unknown
}

/**
 * json-rpc-engine middleware that both logs standard and non-standard error
 * messages and ends middleware stack traversal if an error is encountered
 *
 * @param {MiddlewareConfig} [config={override:true}] - Middleware configuration
 * @returns {Function} json-rpc-engine middleware function
 */
function createErrorMiddleware ({ override = true } = {}) {
  return (req, res, next) => {
    next(done => {
      const { error } = res
      if (!error) { return done() }
      sanitizeRPCError(error)
      log.error(`MetaMask - RPC Error: ${error.message}`, error)
      done()
    })
  }
}

module.exports = createErrorMiddleware
