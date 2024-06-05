import { MESSAGE_TYPE } from '../../../../../../shared/constants/app';

const mmiAuthenticate = {
  methodNames: [MESSAGE_TYPE.MMI_CHECK_IF_TOKEN_IS_PRESENT],
  implementation: mmiCheckIfTokenIsPresentHandler,
  hookNames: {
    handleMmiCheckIfTokenIsPresent: true,
  },
};
export default mmiAuthenticate;

/**
 * @typedef {object} MmiAuthenticateOptions
 * @property {Function} handleMmiCheckIfTokenIsPresent - The metamaskinstitutional_checkIfTokenIsPresent method implementation.
 */

/**
 * @typedef {object} MmiCheckIfTokenIsPresentParam
 * @property {string} service - The service to which we are authenticating, e.g. 'codefi-compliance'
 * @property {object} environment - The environment in which we are authenticating, e.g. 'saturn-dev'
 * @property {envName} envName - The environment to which we are authenticating, e.g. 'neptune-custody-prod'
 * @property {object} token - The token used to authenticate
 */

/**
 * @param {import('json-rpc-engine').JsonRpcRequest<MmiCheckIfTokenIsPresentParam>} req - The JSON-RPC request object.
 * @param {import('json-rpc-engine').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param options0
 * @param options0.handleMmiCheckIfTokenIsPresent
 */
async function mmiCheckIfTokenIsPresentHandler(
  req,
  res,
  _next,
  end,
  { handleMmiCheckIfTokenIsPresent },
) {
  try {
    res.result = await handleMmiCheckIfTokenIsPresent(req);
    return end();
  } catch (error) {
    return end(error);
  }
}
