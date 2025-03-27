import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import type {
  JsonRpcRequest,
  JsonRpcParams,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import { HandlerWrapper } from './types';

type EthAccountsHandlerOptions = {
  getAccounts: () => string[];
};

type EthAccountsConstraint<Params extends JsonRpcParams = JsonRpcParams> = {
  implementation: (
    _req: JsonRpcRequest<Params>,
    res: PendingJsonRpcResponse<string[]>,
    _next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
    { getAccounts }: EthAccountsHandlerOptions,
  ) => Promise<void>;
} & HandlerWrapper;

/**
 * A wrapper for `eth_accounts` that returns an empty array when permission is denied.
 */
const ethAccounts = {
  methodNames: [MESSAGE_TYPE.ETH_ACCOUNTS],
  implementation: ethAccountsHandler,
  hookNames: {
    getAccounts: true,
  },
} satisfies EthAccountsConstraint;
export default ethAccounts;

/**
 *
 * @param _req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param options - The RPC method hooks.
 * @param options.getAccounts - A hook that returns the permitted eth accounts for the origin sorted by lastSelected.
 */
async function ethAccountsHandler<Params extends JsonRpcParams = JsonRpcParams>(
  _req: JsonRpcRequest<Params>,
  res: PendingJsonRpcResponse<string[]>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  { getAccounts }: EthAccountsHandlerOptions,
): Promise<void> {
  res.result = getAccounts();
  return end();
}
