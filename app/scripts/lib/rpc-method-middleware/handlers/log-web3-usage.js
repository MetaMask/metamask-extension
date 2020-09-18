import { MESSAGE_TYPE } from '../../enums'

/**
 * This RPC method is called by our inpage web3 proxy whenever window.web3 is
 * accessed. We're collecting data on window.web3 usage so that we can warn
 * website maintainers, and possibly our users, before we remove window.web3
 * by November 16, 2020.
 */

const logWeb3Usage = {
  methodName: MESSAGE_TYPE.LOG_WEB3_USAGE,
  implementation: logWeb3UsageHandler,
}
export default logWeb3Usage

const recordedWeb3Usage = {}

/**
 * @typedef {Object} LogWeb3UsageOptions
 * @property {string} origin - The origin of the request.
 * @property {Function} sendMetrics - A function that registers a metrics event.
 */

/**
 * @typedef {Object} LogWeb3UsageParam
 * @property {string} action - The action taken (get or set).
 * @property {string} name - The window.web3 property name subject to the action.
 */

/**
 * @param {import('json-rpc-engine').JsonRpcRequest<[LogWeb3UsageParam]>} req - The JSON-RPC request object.
 * @param {import('json-rpc-engine').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {LogWeb3UsageOptions} options
 */
function logWeb3UsageHandler (
  req, res, _next, end,
  { origin, sendMetrics },
) {
  const { action, name } = req.params[0]

  if (!recordedWeb3Usage[origin]) {
    recordedWeb3Usage[origin] = {}
  }
  if (!recordedWeb3Usage[origin][name]) {
    recordedWeb3Usage[origin][name] = true
    sendMetrics({
      action,
      name,
      customVariables: { origin },
    })
  }

  res.result = true
  return end()
}
