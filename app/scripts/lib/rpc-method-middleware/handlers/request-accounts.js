import { ethErrors } from 'eth-rpc-errors';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../../shared/constants/metametrics';
import { shouldEmitDappViewedEvent } from '../../util';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '../../multichain-api/caip25permissions';
import {
  validNotifications,
  validRpcMethods,
} from '../../multichain-api/scope';
import { RestrictedMethods } from '../../../../../shared/constants/permissions';
import { setEthAccounts } from '../../multichain-api/caip-permission-adapter-eth-accounts';

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
    getPermissionsForOrigin: true,
    metamaskState: true,
    grantPermissions: true,
    getNetworkConfigurationByNetworkClientId: true,
    updateCaveat: true,
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
    getPermissionsForOrigin,
    metamaskState,
    grantPermissions,
    getNetworkConfigurationByNetworkClientId,
    updateCaveat,
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

  try {
    const ethAccountsApproval = await requestPermissionApprovalForOrigin({
      [RestrictedMethods.eth_accounts]: {},
    });
    ethAccounts = ethAccountsApproval.approvedAccounts;
  } catch (err) {
    res.error = err;
    return end();
  }

  // TODO: Use permittedChains permission returned from requestPermissionsForOrigin() when available ?
  const { chainId } = getNetworkConfigurationByNetworkClientId(
    req.networkClientId,
  );

  const scopeString = `eip155:${parseInt(chainId, 16)}`;

  const permissions = getPermissionsForOrigin(origin) || {};
  const caip25Endowment = permissions[Caip25EndowmentPermissionName];
  const caip25Caveat = caip25Endowment?.caveats.find(
    ({ type }) => type === Caip25CaveatType,
  );

  if (caip25Caveat) {
    if (caip25Caveat.value.isMultichainOrigin) {
      return end(
        new Error('cannot modify permission granted from multichain flow'),
      ); // TODO: better error
    }
    const updatedCaveatValue = setEthAccounts(caip25Caveat.value, ethAccounts);

    updateCaveat(
      origin,
      Caip25EndowmentPermissionName,
      Caip25CaveatType,
      updatedCaveatValue,
    );
  } else {
    const caveatValue = setEthAccounts(
      {
        requiredScopes: {},
        optionalScopes: {
          [scopeString]: {
            methods: validRpcMethods,
            notifications: validNotifications,
            accounts: [],
          },
        },
        isMultichainOrigin: false,
      },
      ethAccounts,
    );

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
  }

  const numberOfConnectedAccounts = ethAccounts.length;
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

  res.result = ethAccounts;

  return end();
}
