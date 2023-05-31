import { MESSAGE_TYPE } from '../../../../../../shared/constants/app';

const mmiAuthenticate = {
  methodNames: [MESSAGE_TYPE.MMI_AUTHENTICATE, MESSAGE_TYPE.MMI_REAUTHENTICATE],
  implementation: mmiAuthenticateHandler,
  hookNames: {
    handleMmiAuthenticate: true,
  },
};
export default mmiAuthenticate;

/**
 * @typedef {object} MmiAuthenticateOptions
 * @property {Function} handleWatchAssetRequest - The wallet_watchAsset method implementation.
 */

/**
 * @typedef {object} MmiAuthenticateParam
 * @property {string} service - The service to which we are authenticating, e.g. 'codefi-compliance'
 * @property {object} token - The token used to authenticate
 */

/**
 * @param {import('json-rpc-engine').JsonRpcRequest<WatchAssetParam>} req - The JSON-RPC request object.
 * @param {import('json-rpc-engine').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {WatchAssetOptions} options
 */
async function mmiAuthenticateHandler(
  req,
  res,
  _next,
  end,
  { handleMmiAuthenticate },
) {
  try {
    res.result = await handleMmiAuthenticate(req);
    return end();
  } catch (error) {
    return end(error);
  }
}
