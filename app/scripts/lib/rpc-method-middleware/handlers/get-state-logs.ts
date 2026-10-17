import type {
  JsonRpcEngineNextCallback,
  JsonRpcEngineEndCallback,
  MethodHandler,
} from '@metamask/json-rpc-engine';
import type {
  JsonRpcParams,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

export type HandleGetStateLogsRequest = (origin: string) => Promise<string>;

export type GetStateLogsHooks = {
  handleGetStateLogsRequest: HandleGetStateLogsRequest;
};

type GetStateLogsConstraint = MethodHandler<
  GetStateLogsHooks,
  never,
  JsonRpcParams,
  string,
  { origin: string }
>;

/**
 * This RPC method returns a serialized state log for the requesting origin,
 * gated behind a user consent confirmation.
 */
export const getStateLogsHandler = {
  implementation: getStateLogsImplementation,
  hookNames: {
    handleGetStateLogsRequest: true,
  },
} satisfies GetStateLogsConstraint;

const getStateLogsHandlers = {
  [MESSAGE_TYPE.GET_STATE_LOGS]: getStateLogsHandler,
};

export default getStateLogsHandlers;

/**
 * @param req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param options
 * @param options.handleGetStateLogsRequest - An async function that prompts the
 * user for consent and resolves with the serialized state logs.
 */
async function getStateLogsImplementation(
  req: JsonRpcRequest & { origin: string },
  res: PendingJsonRpcResponse<string>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  { handleGetStateLogsRequest }: GetStateLogsHooks,
): Promise<void> {
  res.result = await handleGetStateLogsRequest(req.origin);
  return end();
}
