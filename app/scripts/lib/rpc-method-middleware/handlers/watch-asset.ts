import { ERC1155, ERC721 } from '@metamask/controller-utils';
import { ethErrors } from 'eth-rpc-errors';
import {
  JsonRpcRequest,
  JsonRpcParams,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import { HandleWatchAssetRequest, HandlerWrapper } from './handlers-helper';

type WatchAssetOptions = {
  handleWatchAssetRequest: HandleWatchAssetRequest;
};
type WatchAssetConstraint<Params extends JsonRpcParams = JsonRpcParams> = {
  implementation: (
    req: JsonRpcRequest<Params>,
    res: PendingJsonRpcResponse<true>,
    _next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
    { handleWatchAssetRequest }: WatchAssetOptions,
  ) => Promise<void>;
} & HandlerWrapper;

const watchAsset = {
  methodNames: [MESSAGE_TYPE.WATCH_ASSET],
  implementation: watchAssetHandler,
  hookNames: {
    handleWatchAssetRequest: true,
  },
} satisfies WatchAssetConstraint;

export default watchAsset;

/**
 * @param req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param options
 * @param options.handleWatchAssetRequest - The wallet_watchAsset method implementation.
 */
async function watchAssetHandler<Params extends JsonRpcParams = JsonRpcParams>(
  req: JsonRpcRequest<Params>,
  res: PendingJsonRpcResponse<true>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  { handleWatchAssetRequest }: WatchAssetOptions,
) {
  try {
    const {
      params: { options: asset, type },
      origin,
      networkClientId,
    } = req;

    const { tokenId } = asset;

    if (
      [ERC721, ERC1155].includes(type) &&
      tokenId !== undefined &&
      typeof tokenId !== 'string'
    ) {
      return end(
        ethErrors.rpc.invalidParams({
          message: `Expected parameter 'tokenId' to be type 'string'. Received type '${typeof tokenId}'`,
        }),
      );
    }

    await handleWatchAssetRequest({ asset, type, origin, networkClientId });
    res.result = true;
    return end();
  } catch (error: any) {
    return end(error);
  }
}
