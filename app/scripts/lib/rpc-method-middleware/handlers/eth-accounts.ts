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
import { HandlerWrapper, GetAccounts } from './handlers-helper';

type EthAccountsHandlerOptions = {
  getAccounts: GetAccounts;
};

type EthereumAccountsRequestConstraint<
  Params extends JsonRpcParams = JsonRpcParams,
  Result extends Json = Json,
> = {
  implementation: (
    _req: JsonRpcRequest<Params>,
    res: JsonRpcResponse<Result>,
    _next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
    { getAccounts }: EthAccountsHandlerOptions,
  ) => Promise<void>;
} & HandlerWrapper;

/**
 * A wrapper for `eth_accounts` that returns an empty array when permission is denied.
 */

const requestEthereumAccounts: EthereumAccountsRequestConstraint = {
  methodNames: [MESSAGE_TYPE.ETH_ACCOUNTS],
  implementation: ethAccountsHandler,
  hookNames: {
    getAccounts: true,
  },
};
export default requestEthereumAccounts;

/**
 *
 * @param _req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param options - The RPC method hooks.
 * @param options.getAccounts - Gets the accounts for the requesting
 * origin.
 */
async function ethAccountsHandler<
  Params extends JsonRpcParams = JsonRpcParams,
  Result extends Json = Json,
>(
  _req: JsonRpcRequest<Params>,
  res: JsonRpcResponse<Result>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  { getAccounts }: EthAccountsHandlerOptions,
): Promise<void> {
  res.result = await getAccounts();
  return end();
}
