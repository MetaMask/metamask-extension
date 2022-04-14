import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

const getLanguageOptions = {
  methodNames: [MESSAGE_TYPE.GET_LANGUAGE],
  implementation: getLanguageHandler,
  hookNames: {
    getLanguage: true,
    sendMetrics: true,
  },
};
export default getLanguageOptions;

/**
 * @typedef {Object} getLanguageOptions
 * @property {Function} getLanguage - The wallet_getLanguage implementation
 * @property {Function} sendMetrics - A function that registers a metrics event.
 */

/**
 * @typedef {Object} getLanguageParam
 * @property {string} origin - The origin url
 */

/**
 * @param {import('json-rpc-engine').JsonRpcRequest<WatchAssetParam>} req - The JSON-RPC request object.
 * @param {import('json-rpc-engine').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {getLanguageOptions} options
 */

async function getLanguageHandler(
  req,
  res,
  _next,
  end,
  { getLanguage, sendMetrics },
) {
  const { origin } = req;
  try {
    const walletLang = await getLanguage(origin);

    sendMetrics({
      event: 'Get language',
      category: 'Permission',
      referrer: {
        url: origin,
      },
    });

    res.result = walletLang;
  } catch (error) {
    return end(error);
  }
  return end();
}
