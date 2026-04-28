import type {
  JsonRpcEngineNextCallback,
  JsonRpcEngineEndCallback,
  MethodHandler,
} from '@metamask/json-rpc-engine';
import type {
  PendingJsonRpcResponse,
  Hex,
  JsonRpcRequest,
} from '@metamask/utils';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

export type ProviderStateHandlerRequest = JsonRpcRequest<{
  isInitializingStreamProvider?: boolean;
}> & {
  origin: string;
};

/**
 * @property chainId - The current chain ID.
 * @property isUnlocked - Whether the extension is unlocked or not.
 * @property networkVersion - The current network ID.
 * @property accounts - List of permitted accounts for the specified origin.
 */
export type ProviderStateHandlerResult = {
  chainId: Hex;
  isUnlocked: boolean;
  networkVersion: string;
  accounts: string[];
};

export type GetProviderState = (
  origin: string,
  options?: { isInitializingStreamProvider?: boolean },
) => Promise<ProviderStateHandlerResult>;

export type GetProviderStateHooks = {
  getProviderState: GetProviderState;
};

type GetProviderStateConstraint = MethodHandler<GetProviderStateHooks>;

/**
 * This RPC method gets background state relevant to the provider.
 * The background sends RPC notifications on state changes, but the provider
 * first requests state on initialization.
 */
const getProviderState = {
  methodNames: [MESSAGE_TYPE.GET_PROVIDER_STATE],
  implementation:
    getProviderStateHandler as unknown as GetProviderStateConstraint['implementation'],
  hookNames: {
    getProviderState: true,
  },
} satisfies GetProviderStateConstraint;

const getProviderStateHandlers = {
  [MESSAGE_TYPE.GET_PROVIDER_STATE]: getProviderState,
};

export default getProviderStateHandlers;

/**
 * @param req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param options
 * @param options.getProviderState - An async function that gets the current provider state.
 */
async function getProviderStateHandler(
  req: ProviderStateHandlerRequest,
  res: PendingJsonRpcResponse<ProviderStateHandlerResult>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  { getProviderState: _getProviderState }: GetProviderStateHooks,
): Promise<void> {
  const isInitializingStreamProvider = req.params?.isInitializingStreamProvider;
  res.result = {
    ...(await _getProviderState(req.origin, { isInitializingStreamProvider })),
  };
  return end();
}
