import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

const getLocaleOptions = {
  methodNames: [MESSAGE_TYPE.GET_LOCALE],
  implementation: getLocaleHandler,
  hookNames: {
    getWalletLocale: true,
    sendMetrics: true,
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
  { getWalletLocale, sendMetrics },
) {
  const { origin } = req;
  try {
    const walletLocale = await getWalletLocale();

    sendMetrics({
      event: 'Get locale',
      category: 'Permission',
      referrer: {
        url: origin,
      },
    });

    res.result = walletLocale;
  } catch (error) {
    return end(error);
  }
  return end();
}
