import { MESSAGE_TYPE } from '../../../../../../shared/constants/app';

const mmiSupported = {
  methodNames: [MESSAGE_TYPE.MMI_SUPPORTED],
  implementation: mmiSupportedHandler,
  hookNames: {},
};
export default mmiSupported;

/**
 * @typedef {object} MmiAuthenticateOptions
 * @property {Function} mmiSupportedHandler
 * This method simply returns true if this is Metamask Institutional
 */

/**
 * @typedef {object} MmiSupportedParam
 * @property {string} mmiSupported No parameters
 */

/**
 * @param {import('json-rpc-engine').JsonRpcRequest<WatchAssetParam>} _req - The JSON-RPC request object.
 * @param {import('json-rpc-engine').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 */
async function mmiSupportedHandler(_req, res, _next, end) {
  try {
    res.result = true;
    return end();
  } catch (error) {
    return end(error);
  }
}
