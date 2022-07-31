import { ethErrors } from 'eth-rpc-errors';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

const watchAsset = {
  methodNames: [MESSAGE_TYPE.WATCH_ASSET, MESSAGE_TYPE.WATCH_ASSET_LEGACY],
  implementation: watchAssetHandler,
  hookNames: {
    handleWatchAssetRequest: true,
  },
};
export default watchAsset;

/**
 * @typedef {object} WatchAssetOptions
 * @property {Function} handleWatchAssetRequest - The wallet_watchAsset method implementation.
 */

/**
 * @typedef {object} WatchAssetParam
 * @property {string} type - The type of the asset to watch.
 * @property {object} options - Watch options for the asset.
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
    const { options: asset, type } = req.params;
    const handleWatchAssetResult = await handleWatchAssetRequest(asset, type);
    await handleWatchAssetResult.result;
    res.result = true;
    return end();
  } catch (error) {
    if (error.message === 'User rejected to watch the asset.') {
      return end(ethErrors.provider.userRejectedRequest());
    }
    return end(error);
  }
}
