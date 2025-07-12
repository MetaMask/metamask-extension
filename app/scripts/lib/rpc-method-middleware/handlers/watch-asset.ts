import { rpcErrors } from '@metamask/rpc-errors';
import type {
  JsonRpcEngineCallbackError,
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import {
  JsonRpcRequest,
  JsonRpcParams,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import { ERC1155, ERC721 } from '@metamask/controller-utils';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import { HandlerWrapper } from './types';

type HandleWatchAssetRequest = (
  options: Record<string, string | Record<string, string>>,
) => Promise<void>;

type WatchAssetRequest<Params extends JsonRpcParams> = JsonRpcRequest<Params> &
  Partial<{ origin: string; networkClientId: string }> & {
    params: { options: { tokenId: string }; type: string };
  };

type WatchAssetOptions = {
  handleWatchAssetRequest: HandleWatchAssetRequest;
};
type WatchAssetConstraint<Params extends JsonRpcParams = JsonRpcParams> = {
  implementation: (
    req: WatchAssetRequest<Params>,
    res: PendingJsonRpcResponse<true>,
    _next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
    { handleWatchAssetRequest }: WatchAssetOptions,
  ) => Promise<void>;
} & HandlerWrapper;

const watchAsset = {
  methodNames: [MESSAGE_TYPE.WATCH_ASSET, MESSAGE_TYPE.WATCH_ASSET_LEGACY],
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
  req: WatchAssetRequest<Params>,
  res: PendingJsonRpcResponse<true>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  { handleWatchAssetRequest }: WatchAssetOptions,
): Promise<void> {
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
        rpcErrors.invalidParams({
          message: `Expected parameter 'tokenId' to be type 'string'. Received type '${typeof tokenId}'`,
        }),
      );
    }

    await handleWatchAssetRequest({
      asset,
      type,
      origin: origin ?? '',
      networkClientId: networkClientId ?? '',
    });
    res.result = true;
    return end();
  } catch (error: unknown) {
    return end(error as JsonRpcEngineCallbackError);
  }
}
