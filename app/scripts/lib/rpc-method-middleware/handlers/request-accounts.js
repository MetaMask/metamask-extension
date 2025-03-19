import { rpcErrors } from '@metamask/rpc-errors';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../../shared/constants/metametrics';
import { shouldEmitDappViewedEvent } from '../../util';

/**
 * This method attempts to retrieve the Ethereum accounts available to the
 * requester, or initiate a request for account access if none are currently
 * available. It is essentially a wrapper of wallet_requestPermissions that
 * only errors if the user rejects the request. We maintain the method for
 * backwards compatibility reasons.
 */

const requestEthereumAccounts = {
  methodNames: [MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS],
  implementation: requestEthereumAccountsHandler,
  hookNames: {
    origin: true,
    getAccounts: true,
    getUnlockPromise: true,
    hasPermission: true,
    requestAccountsPermission: true,
    sendMetrics: true,
    getPermissionsForOrigin: true,
    metamaskState: true,
  },
};
export default requestEthereumAccounts;

// Used to rate-limit pending requests to one per origin
const locks = new Set();

/**
 * @typedef {Record<string, string | Function>} RequestEthereumAccountsOptions
 * @property {string} origin - The requesting origin.
 * @property {Function} getAccounts - Gets the accounts for the requesting
 * origin.
 * @property {Function} getUnlockPromise - Gets a promise that resolves when
 * the extension unlocks.
 * @property {Function} hasPermission - Returns whether the requesting origin
 * has the specified permission.
 * @property {Function} requestAccountsPermission - Requests the `eth_accounts`
 * permission for the requesting origin.
 */

/**
 *
 * @param {import('@metamask/utils').JsonRpcRequest<unknown>} _req - The JSON-RPC request object.
 * @param {import('@metamask/utils').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {RequestEthereumAccountsOptions} options - The RPC method hooks.
 */
async function requestEthereumAccountsHandler(
  _req,
  res,
  _next,
  end,
  {
    origin,
    getAccounts,
    getUnlockPromise,
    hasPermission,
    requestAccountsPermission,
    sendMetrics,
    getPermissionsForOrigin,
    metamaskState,
  },
) {
  if (locks.has(origin)) {
    res.error = rpcErrors.resourceUnavailable(
      `Already processing ${MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS}. Please wait.`,
    );
    return end();
  }

  if (hasPermission(MESSAGE_TYPE.ETH_ACCOUNTS)) {
    // We wait for the extension to unlock in this case only, because permission
    // requests are handled when the extension is unlocked, regardless of the
    // lock state when they were received.
    try {
      locks.add(origin);
      await getUnlockPromise(true);
      res.result = await getAccounts();
      end();
    } catch (error) {
      end(error);
    } finally {
      locks.delete(origin);
    }
    return undefined;
  }

  // If no accounts, request the accounts permission
  try {
    await requestAccountsPermission();
  } catch (err) {
    res.error = err;
    return end();
  }

  // Get the approved accounts
  const accounts = await getAccounts();
  /* istanbul ignore else: too hard to induce, see below comment */
  if (accounts.length > 0) {
    res.result = accounts;
    const numberOfConnectedAccounts =
      getPermissionsForOrigin(origin).eth_accounts.caveats[0].value.length;
    // first time connection to dapp will lead to no log in the permissionHistory
    // and if user has connected to dapp before, the dapp origin will be included in the permissionHistory state
    // we will leverage that to identify `is_first_visit` for metrics
    const isFirstVisit = !Object.keys(metamaskState.permissionHistory).includes(
      origin,
    );
    if (shouldEmitDappViewedEvent(metamaskState.metaMetricsId)) {
      sendMetrics({
        event: MetaMetricsEventName.DappViewed,
        category: MetaMetricsEventCategory.InpageProvider,
        referrer: {
          url: origin,
        },
        properties: {
          is_first_visit: isFirstVisit,
          number_of_accounts: Object.keys(metamaskState.accounts).length,
          number_of_accounts_connected: numberOfConnectedAccounts,
        },
      });
    }
  } else {
    // This should never happen, because it should be caught in the
    // above catch clause
    res.error = rpcErrors.internal(
      'Accounts unexpectedly unavailable. Please report this bug.',
    );
  }

  return end();
}
