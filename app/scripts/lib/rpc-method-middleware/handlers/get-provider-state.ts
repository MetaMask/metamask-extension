import type {
  JsonRpcEngineNextCallback,
  JsonRpcEngineEndCallback,
} from '@metamask/json-rpc-engine';
import type {
  JsonRpcRequest,
  PendingJsonRpcResponse,
  JsonRpcParams,
} from '@metamask/utils';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  HandlerWrapper,
  GetProviderState,
  ProviderStateHandlerResult,
} from './handlers-helper';

type GetProviderStateConstraint<Params extends JsonRpcParams = JsonRpcParams> =
  {
    implementation: (
      _req: JsonRpcRequest<Params>,
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
  req: JsonRpcRequest<Params>,
  res: PendingJsonRpcResponse<ProviderStateHandlerResult>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  { getProviderState: _getProviderState }: Record<string, GetProviderState>,
): Promise<void> {
  const { origin } = req.origin;
  res.result = {
    ...(await _getProviderState(origin)),
  };
  return end();
}
