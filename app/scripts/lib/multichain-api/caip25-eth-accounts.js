import { parseCaipAccountId } from '@metamask/utils';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';

/**
 * A wrapper for `eth_accounts` that returns an empty array when permission is denied.
 */

export const caip25requestEthereumAccounts = {
  methodNames: [MESSAGE_TYPE.ETH_ACCOUNTS],
  implementation: caip25ethAccountsHandler,
  hookNames: {
    getAccounts: true,
  },
};

/**
 * @typedef {Record<string, Function>} EthAccountsOptions
 * @property {Function} getAccounts - Gets the accounts for the requesting
 * origin.
 */

/**
 *
 * @param {import('json-rpc-engine').JsonRpcRequest<unknown>} _req - The JSON-RPC request object.
 * @param req
 * @param {import('json-rpc-engine').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {EthAccountsOptions} options - The RPC method hooks.
 */
async function caip25ethAccountsHandler(req, res, _next, end) {
  res.result = req.accounts.map(
    (caipAccountId) => parseCaipAccountId(caipAccountId).address,
  );
  return end();
}
