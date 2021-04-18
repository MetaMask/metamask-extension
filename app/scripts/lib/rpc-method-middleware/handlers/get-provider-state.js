import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

/**
 * This RPC method gets background state relevant to the provider.
 * The background sends RPC notifications on state changes, but the provider
 * first requests state on initialization.
 */

const getProviderState = {
  methodNames: [MESSAGE_TYPE.GET_PROVIDER_STATE],
  implementation: getProviderStateHandler,
};
export default getProviderState;

/**
 * @typedef {Object} ProviderStateHandlerResult
 * @property {string} chainId - The current chain ID.
 * @property {boolean} isUnlocked - Whether the extension is unlocked or not.
 * @property {string} networkVersion - The current network ID.
 */

/**
 * @typedef {Object} ProviderStateHandlerOptions
 * @property {() => ProviderStateHandlerResult} getProviderState - A function that
 * gets the current provider state.
 */

/**
 * @param {import('json-rpc-engine').JsonRpcRequest<[]>} req - The JSON-RPC request object.
 * @param {import('json-rpc-engine').JsonRpcResponse<ProviderStateHandlerResult>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {ProviderStateHandlerOptions} options
 */
async function getProviderStateHandler(
  req,
  res,
  _next,
  end,
  { getProviderState: _getProviderState },
) {
  res.result = {
    ...(await _getProviderState(req.origin)),
  };
  return end();
}
