import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

const getWalletCurrency = {
  methodNames: [MESSAGE_TYPE.GET_PREFERRED_CURRENCY],
  implementation: getWalletCurrencyHandler,
  hookNames: {
    getPreferredCurrency: true,
    sendMetrics: true,
  },
};
export default getWalletCurrency;

/**
 * @typedef {Object} getWalletCurrency
 * @property {Function} getPreferredCurrency - The wallet_preferredCurrency implementation
 * @property {Function} sendMetrics - A function that registers a metrics event.
 */

/**
 * @typedef {Object} getWalletCurrencyParam
 * @property {string} origin - The origin url
 */

/**
 * @param {import('json-rpc-engine').JsonRpcRequest<WatchAssetParam>} req - The JSON-RPC request object.
 * @param {import('json-rpc-engine').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {getWalletCurrency} options
 */

async function getWalletCurrencyHandler(
  req,
  res,
  _next,
  end,
  { getPreferredCurrency, sendMetrics },
) {
  const { origin } = req;
  try {
    const walletPreferredCurrency = await getPreferredCurrency();

    sendMetrics({
      event: 'Get wallet preferred currency',
      category: 'Permission',
      referrer: {
        url: origin,
      },
    });

    res.result = walletPreferredCurrency;
  } catch (error) {
    return end(error);
  }
  return end();
}