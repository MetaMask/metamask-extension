import type {
  JsonRpcEngineNextCallback,
  JsonRpcEngineEndCallback,
  MethodHandler,
} from '@metamask/json-rpc-engine';
import type { JsonRpcParams, PendingJsonRpcResponse } from '@metamask/utils';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import { HandlerRequestType as LogWeb3ShimUsageHandlerRequest } from './types';

export type GetWeb3ShimUsageState = (origin: string) => undefined | 1 | 2;
export type SetWeb3ShimUsageRecorded = (origin: string) => void;

export type LogWeb3ShimUsageHooks = {
  getWeb3ShimUsageState: GetWeb3ShimUsageState;
  setWeb3ShimUsageRecorded: SetWeb3ShimUsageRecorded;
};

type LogWeb3ShimUsageConstraint = MethodHandler<LogWeb3ShimUsageHooks>;

/**
 * This RPC method is called by the inpage provider whenever it detects the
 * accessing of a non-existent property on our window.web3 shim. We use this
 * to alert the user that they are using a legacy dapp, and will have to take
 * further steps to be able to use it.
 */
const logWeb3ShimUsage = {
  methodNames: [MESSAGE_TYPE.LOG_WEB3_SHIM_USAGE],
  implementation:
    logWeb3ShimUsageHandler as unknown as LogWeb3ShimUsageConstraint['implementation'],
  hookNames: {
    getWeb3ShimUsageState: true,
    setWeb3ShimUsageRecorded: true,
  },
} satisfies LogWeb3ShimUsageConstraint;

const logWeb3ShimUsageHandlers = {
  [MESSAGE_TYPE.LOG_WEB3_SHIM_USAGE]: logWeb3ShimUsage,
};

export default logWeb3ShimUsageHandlers;

/**
 * @param req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param options
 * @param options.getWeb3ShimUsageState - A function that gets web3 shim
 * usage state for the given origin.
 * @param options.setWeb3ShimUsageRecorded - A function that records web3 shim
 * usage for a particular origin.
 */
function logWeb3ShimUsageHandler<Params extends JsonRpcParams = JsonRpcParams>(
  req: LogWeb3ShimUsageHandlerRequest<Params>,
  res: PendingJsonRpcResponse<true>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  { getWeb3ShimUsageState, setWeb3ShimUsageRecorded }: LogWeb3ShimUsageHooks,
): void {
  const { origin } = req;
  if (getWeb3ShimUsageState(origin) === undefined) {
    setWeb3ShimUsageRecorded(origin);
  }

  res.result = true;
  return end();
}
