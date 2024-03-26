import type {
  JsonRpcEngineNextCallback,
  JsonRpcEngineEndCallback,
} from '@metamask/json-rpc-engine';
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcParams,
  Json,
} from '@metamask/utils';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  HandlerWrapperType,
  getWeb3ShimUsageStateType,
  setWeb3ShimUsageRecordedType,
} from './handlers-helpers';

type logWeb3ShimUsageOptionsType = {
  getWeb3ShimUsageState: getWeb3ShimUsageStateType;
  setWeb3ShimUsageRecorded: setWeb3ShimUsageRecordedType;
};

type logWeb3ShimUsageType<
  Params extends JsonRpcParams = JsonRpcParams,
  Result extends Json = Json,
> = {
  implementation: (
    req: JsonRpcRequest<Params>,
    res: JsonRpcResponse<Result>,
    _next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
    {
      getWeb3ShimUsageState,
      setWeb3ShimUsageRecorded,
    }: logWeb3ShimUsageOptionsType,
  ) => void;
} & HandlerWrapperType;

/**
 * This RPC method is called by the inpage provider whenever it detects the
 * accessing of a non-existent property on our window.web3 shim. We use this
 * to alert the user that they are using a legacy dapp, and will have to take
 * further steps to be able to use it.
 */
const logWeb3ShimUsage: logWeb3ShimUsageType = {
  methodNames: [MESSAGE_TYPE.LOG_WEB3_SHIM_USAGE],
  implementation: logWeb3ShimUsageHandler,
  hookNames: {
    getWeb3ShimUsageState: true,
    setWeb3ShimUsageRecorded: true,
  },
};
export default logWeb3ShimUsage;

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
function logWeb3ShimUsageHandler<
  Params extends JsonRpcParams = JsonRpcParams,
  Result extends Json = Json,
>(
  req: JsonRpcRequest<Params>,
  res: JsonRpcResponse<Result>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    getWeb3ShimUsageState,
    setWeb3ShimUsageRecorded,
  }: logWeb3ShimUsageOptionsType,
) {
  const { origin } = req;
  if (getWeb3ShimUsageState(origin) === undefined) {
    setWeb3ShimUsageRecorded(origin);
  }

  res.result = true;
  return end();
}
