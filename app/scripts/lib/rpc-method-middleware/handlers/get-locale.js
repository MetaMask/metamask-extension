import { ethErrors } from 'eth-rpc-errors';

import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

const getLocaleOptions = {
  methodNames: [MESSAGE_TYPE.GET_LOCALE],
  implementation: getLocaleHandler,
  hookNames: {
    getWalletLocale: true,
    hasPermission: true,
  },
};
export default getLocaleOptions;

/**
 * @typedef {Object} getLocaleOptions
 * @property {Function} getWalletLocale - The wallet_getLocale implementation
 * @property {Function} sendMetrics - A function that registers a metrics event.
 */

/**
 * @typedef {Object} getLocaleParam
 * @property {string} origin - The origin url
 */

/**
 * @param {import('json-rpc-engine').JsonRpcRequest<WatchAssetParam>} req - The JSON-RPC request object.
 * @param {import('json-rpc-engine').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {getLocaleOptions} options
 */


async function getLocaleHandler(
  req,
  res,
  _next,
  end,
  { getWalletLocale, hasPermission },
) {
    if (hasPermission(MESSAGE_TYPE.GET_LOCALE)) {
      // We wait for the extension to unlock in this case only, because permission
      // requests are handled when the extension is unlocked, regardless of the
      // lock state when they were received.
      try {
        const walletLocale = await getWalletLocale();
        res.result = walletLocale;
      } catch (error) {
        end(error);
      }
      return end();
    }
    
    return end(ethErrors.provider.unauthorized());
  
}
