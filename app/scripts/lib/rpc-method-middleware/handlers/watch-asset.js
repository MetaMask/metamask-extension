import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

const watchAsset = {
  methodNames: [MESSAGE_TYPE.WATCH_ASSET, MESSAGE_TYPE.WATCH_ASSET_LEGACY],
  implementation: watchAssetHandler,
};
export default watchAsset;

/**
 * @typedef {Object} WatchAssetOptions
 * @property {Function} handleWatchAssetRequest - The wallet_watchAsset method implementation.
 */

/**
 * @typedef {Object} WatchAssetParam
 * @property {string} type - The type of the asset to watch.
 * @property {Object} options - Watch options for the asset.
 */

/**
 * @param {import('json-rpc-engine').JsonRpcRequest<WatchAssetParam>} req - The JSON-RPC request object.
 * @param {import('json-rpc-engine').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {WatchAssetOptions} options
 */
async function watchAssetHandler(
  req,
  res,
  _next,
  end,
  { handleWatchAssetRequest },
) {
  try {
    res.result = await handleWatchAssetRequest(req);
    return end();
  } catch (error) {
    return end(error);
  }
}
