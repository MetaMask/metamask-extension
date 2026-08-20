import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
  MethodHandler,
} from '@metamask/json-rpc-engine';
import type {
  JsonRpcRequest,
  JsonRpcParams,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

export type EthAccountsHooks = {
  getAccounts: () => string[];
};

type EthAccountsConstraint = MethodHandler<
  EthAccountsHooks,
  never,
  JsonRpcParams,
  string[]
>;

/**
 * A wrapper for `eth_accounts` that returns an empty array when permission is denied.
 */
export const ethAccountsHandler = {
  implementation: ethAccountsImplementation,
  hookNames: {
    getAccounts: true,
  },
} satisfies EthAccountsConstraint;

const ethAccountsHandlers = {
  [MESSAGE_TYPE.ETH_ACCOUNTS]: ethAccountsHandler,
};

export default ethAccountsHandlers;

/**
 *
 * @param _req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param options - The RPC method hooks.
 * @param options.getAccounts - A hook that returns the permitted eth accounts for the origin sorted by lastSelected.
 */
async function ethAccountsImplementation(
  _req: JsonRpcRequest,
  res: PendingJsonRpcResponse<string[]>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  { getAccounts }: EthAccountsHooks,
): Promise<void> {
  res.result = getAccounts();
  return end();
}
