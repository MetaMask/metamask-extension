import { ethErrors } from 'eth-rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/multichain/caip25Permission';
import { setEthAccounts } from '@metamask/multichain/adapters/caip-permission-adapter-eth-accounts';
import { setPermittedEthChainIds } from '@metamask/multichain/adapters/caip-permission-adapter-permittedChains';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../../shared/constants/metametrics';
import { shouldEmitDappViewedEvent } from '../../util';
import { RestrictedMethods } from '../../../../../shared/constants/permissions';
import { PermissionNames } from '../../../controllers/permissions';

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
    getAccounts: true,
    getUnlockPromise: true,
    requestPermissionApprovalForOrigin: true,
    sendMetrics: true,
    metamaskState: true,
    grantPermissions: true,
  },
};
export default requestEthereumAccounts;

// Used to rate-limit pending requests to one per origin
const locks = new Set();

/**
 * @typedef {Record<string, string | Function>} RequestEthereumAccountsOptions
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
 * @param {import('json-rpc-engine').JsonRpcRequest<unknown>} req - The JSON-RPC request object.
 * @param {import('json-rpc-engine').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {RequestEthereumAccountsOptions} options - The RPC method hooks.
 */
async function requestEthereumAccountsHandler(
  req,
  res,
  _next,
  end,
  {
    getAccounts,
    getUnlockPromise,
    requestPermissionApprovalForOrigin,
    sendMetrics,
    metamaskState,
    grantPermissions,
  },
) {
  const { origin } = req;
  if (locks.has(origin)) {
    res.error = ethErrors.rpc.resourceUnavailable(
      `Already processing ${MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS}. Please wait.`,
    );
    return end();
  }

  let ethAccounts = await getAccounts();
  if (ethAccounts.length > 0) {
    // We wait for the extension to unlock in this case only, because permission
    // requests are handled when the extension is unlocked, regardless of the
    // lock state when they were received.
    try {
      locks.add(origin);
      await getUnlockPromise(true);
      res.result = ethAccounts;
      end();
    } catch (error) {
      end(error);
    } finally {
      locks.delete(origin);
    }
    return undefined;
  }

  let legacyApproval;
  try {
    legacyApproval = await requestPermissionApprovalForOrigin({
      [RestrictedMethods.eth_accounts]: {},
      [PermissionNames.permittedChains]: {},
    });
  } catch (err) {
    res.error = err;
    return end();
  }

  // NOTE: the eth_accounts/permittedChains approvals will be combined in the future.
  // We assume that approvedAccounts and permittedChains are both defined here.
  // Until they are actually combined, when testing, you must request both
  // eth_accounts and permittedChains together.
  let caveatValue = {
    requiredScopes: {},
    optionalScopes: {},
    isMultichainOrigin: false,
  };
  caveatValue = setPermittedEthChainIds(
    caveatValue,
    legacyApproval.approvedChainIds,
  );

  caveatValue = setEthAccounts(caveatValue, legacyApproval.approvedAccounts);

  grantPermissions({
    subject: { origin },
    approvedPermissions: {
      [Caip25EndowmentPermissionName]: {
        caveats: [
          {
            type: Caip25CaveatType,
            value: caveatValue,
          },
        ],
      },
    },
  });

  ethAccounts = await getAccounts();
  // first time connection to dapp will lead to no log in the permissionHistory
  // and if user has connected to dapp before, the dapp origin will be included in the permissionHistory state
  // we will leverage that to identify `is_first_visit` for metrics
  if (shouldEmitDappViewedEvent(metamaskState.metaMetricsId)) {
    const isFirstVisit = !Object.keys(metamaskState.permissionHistory).includes(
      origin,
    );
    sendMetrics({
      event: MetaMetricsEventName.DappViewed,
      category: MetaMetricsEventCategory.InpageProvider,
      referrer: {
        url: origin,
      },
      properties: {
        is_first_visit: isFirstVisit,
        number_of_accounts: Object.keys(metamaskState.accounts).length,
        number_of_accounts_connected: ethAccounts.length,
      },
    });
  }

  // We cannot derive ethAccounts directly from the CAIP-25 permission
  // because the accounts will not be in order of lastSelected
  res.result = ethAccounts;

  return end();
}
