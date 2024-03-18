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

type EthereumAccountsRequestType<
  Params extends JsonRpcParams = JsonRpcParams,
  Result extends Json = Json,
> = {
  methodNames: [string];
  implementation: (
    _req: JsonRpcRequest<Params>,
    res: JsonRpcResponse<Result>,
    _next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
    { getAccounts }: Record<string, () => Promise<string[]>>,
  ) => Promise<void>;
  hookNames: Record<string, boolean>;
};

/**
 * A wrapper for `eth_accounts` that returns an empty array when permission is denied.
 */

const requestEthereumAccounts: EthereumAccountsRequestType = {
  methodNames: [MESSAGE_TYPE.ETH_ACCOUNTS],
  implementation: ethAccountsHandler,
  hookNames: {
    getAccounts: true,
  },
};
export default requestEthereumAccounts;

/**
 * @typedef {Record<string, Function>} EthAccountsOptions
 * @property {Function} getAccounts - Gets the accounts for the requesting
 * origin.
 */

/**
 *
 * @param _req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param options - The RPC method hooks.
 * @param options.getAccounts
 */
async function ethAccountsHandler<
  Params extends JsonRpcParams = JsonRpcParams,
  Result extends Json = Json,
>(
  _req: JsonRpcRequest<Params>,
  res: JsonRpcResponse<Result>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  { getAccounts }: Record<string, () => Promise<string[]>>,
): Promise<void> {
  res.result = await getAccounts();
  return end();
}
