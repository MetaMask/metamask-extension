import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

/**
 * A wrapper for `eth_accounts` that returns an empty array when permission is denied.
 */

const requestEthereumAccounts = {
  methodNames: [MESSAGE_TYPE.ETH_ACCOUNTS],
  implementation: ethAccountsHandler,
  hookNames: {
    getAccounts: true,
  },
};
export default requestEthereumAccounts;

/**
 * @typedef {import('@metamask/utils').JsonRpcParams} JsonRpcParams
 * @typedef {import('@metamask/utils').Json} Json
 */

/**
 * @typedef {Record<string, Function>} EthAccountsOptions
 * @property {Function} getAccounts - Gets the accounts for the requesting
 * origin.
 */

/**
 *
 * @param {import('@metamask/utils').JsonRpcRequest<JsonRpcParams>} _req - The JSON-RPC request object.
 * @param {import('@metamask/utils').JsonRpcResponse<Json>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {EthAccountsOptions} options - The RPC method hooks.
 */
async function ethAccountsHandler(_req, res, _next, end, { getAccounts }) {
  res.result = await getAccounts();
  return end();
}
