import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

/**
 * This RPC method allows to request captcha tokens for the given origin
 */

const requestCaptcha = {
  methodNames: [MESSAGE_TYPE.REQUEST_CAPTCHA],
  implementation: requestCaptchaHandler,
};

export default requestCaptcha;

/**
 * @typedef {Object} RequestCaptchaStateHandlerOptions
 * @property {() => ProviderStateHandlerResult} requestCaptcha - A function that
 * gets the captchaTokenController.
 */

/**
 * @param {import('json-rpc-engine').JsonRpcRequest<[]>} req - The JSON-RPC request object.
 * @param {import('json-rpc-engine').JsonRpcResponse<Boolean>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {RequestCaptchaStateHandlerOptions} options
 */
async function requestCaptchaHandler(
  req,
  res,
  _next,
  end,
  { requestCaptcha: getState },
) {
  const { captchaTokenController } = getState();
  captchaTokenController.initiateTokenRequest(req.origin);

  res.result = true;

  return end();
}
