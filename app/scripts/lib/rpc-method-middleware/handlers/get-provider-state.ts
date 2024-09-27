import type {
  JsonRpcEngineNextCallback,
  JsonRpcEngineEndCallback,
} from 'json-rpc-engine';
import type { PendingJsonRpcResponse, JsonRpcParams } from '@metamask/utils';
import { OriginString } from '@metamask/permission-controller';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  HandlerWrapper,
  HandlerRequestType as ProviderStateHandlerRequest,
} from './types';

/**
 * @property chainId - The current chain ID.
 * @property isUnlocked - Whether the extension is unlocked or not.
 * @property networkVersion - The current network ID.
 * @property accounts - List of permitted accounts for the specified origin.
 */
export type ProviderStateHandlerResult = {
  chainId: string;
  isUnlocked: boolean;
  networkVersion: string;
  accounts: string[];
};

export type GetProviderState = (
  origin: OriginString,
) => Promise<ProviderStateHandlerResult>;

type GetProviderStateConstraint<Params extends JsonRpcParams = JsonRpcParams> =
  {
    implementation: (
      _req: ProviderStateHandlerRequest<Params>,
      res: PendingJsonRpcResponse<ProviderStateHandlerResult>,
      _next: JsonRpcEngineNextCallback,
      end: JsonRpcEngineEndCallback,
      { _getProviderState }: Record<string, GetProviderState>,
    ) => Promise<void>;
  } & HandlerWrapper;

/**
 * This RPC method gets background state relevant to the provider.
 * The background sends RPC notifications on state changes, but the provider
 * first requests state on initialization.
 */
const getProviderState = {
  methodNames: [MESSAGE_TYPE.GET_PROVIDER_STATE],
  implementation: getProviderStateHandler,
  hookNames: {
    getProviderState: true,
  },
} satisfies GetProviderStateConstraint;

export default getProviderState;

/**
 * @param req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param options
 * @param options.getProviderState - An async function that gets the current provider state.
 */
async function getProviderStateHandler<
  Params extends JsonRpcParams = JsonRpcParams,
>(
  req: ProviderStateHandlerRequest<Params>,
  res: PendingJsonRpcResponse<ProviderStateHandlerResult>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  { getProviderState: _getProviderState }: Record<string, GetProviderState>,
): Promise<void> {
  res.result = {
    ...(await _getProviderState(req.origin)),
  };
  return end();
}
