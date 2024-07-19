import { parseCaipAccountId } from '@metamask/utils';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '../../multichain-api/caip25permissions';
import { mergeScopes } from '../../multichain-api/scope';

/**
 * A wrapper for `eth_accounts` that returns an empty array when permission is denied.
 */

const requestEthereumAccounts = {
  methodNames: [MESSAGE_TYPE.ETH_ACCOUNTS],
  implementation: ethAccountsHandler,
  hookNames: {
    getAccounts: true,
    getCaveat: true,
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
 * @param {import('json-rpc-engine').JsonRpcRequest<unknown>} _req - The JSON-RPC request object.
 * @param req
 * @param {import('json-rpc-engine').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {EthAccountsOptions} options - The RPC method hooks.
 */
async function ethAccountsHandler(
  req,
  res,
  _next,
  end,
  { getAccounts, getCaveat },
) {
  if (process.env.BARAD_DUR) {
    const caveat = getCaveat(
      req.origin,
      Caip25EndowmentPermissionName,
      Caip25CaveatType,
    );
    if (!caveat) {
      res.result = [];
      return end();
    }

    const ethAccounts = [];
    const sessionScopes = mergeScopes(
      caveat.value.requiredScopes,
      caveat.value.optionalScopes,
    );

    Object.entries(sessionScopes).forEach(([_, { accounts }]) => {
      accounts?.forEach((account) => {
        const {
          address,
          chain: { namespace },
        } = parseCaipAccountId(account);

        if (namespace === 'eip155') {
          ethAccounts.push(address);
        }
      });
    });
    res.result = ethAccounts;
    return end();
  }
  res.result = await getAccounts();
  return end();
}
