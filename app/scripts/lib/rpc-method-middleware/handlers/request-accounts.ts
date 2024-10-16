import { ethErrors } from 'eth-rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  setEthAccounts,
  setPermittedEthChainIds,
} from '@metamask/multichain';
import {
  Caveat,
  CaveatSpecificationConstraint,
  PermissionController,
  PermissionSpecificationConstraint,
  RequestedPermissions,
  ValidPermission,
} from '@metamask/permission-controller';
import {
  Hex,
  Json,
  JsonRpcParams,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from 'json-rpc-engine';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
  MetaMetricsEventPayload,
  MetaMetricsEventOptions,
} from '../../../../../shared/constants/metametrics';
import { shouldEmitDappViewedEvent } from '../../util';
import { RestrictedMethods } from '../../../../../shared/constants/permissions';
import { PermissionNames } from '../../../controllers/permissions';
// eslint-disable-next-line import/no-restricted-paths
import { isSnapId } from '../../../../../ui/helpers/utils/snaps';

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

type AbstractPermissionController = PermissionController<
  PermissionSpecificationConstraint,
  CaveatSpecificationConstraint
>;

// Used to rate-limit pending requests to one per origin
const locks = new Set();

async function requestEthereumAccountsHandler(
  req: JsonRpcRequest<JsonRpcParams> & { origin: string },
  res: PendingJsonRpcResponse<string[]>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    getAccounts,
    getUnlockPromise,
    requestPermissionApprovalForOrigin,
    sendMetrics,
    metamaskState,
    grantPermissions,
  }: {
    getAccounts: () => Promise<string[]>;
    getUnlockPromise: (shouldShowUnlockRequest: true) => Promise<void>;
    requestPermissionApprovalForOrigin: (
      requestedPermissions: RequestedPermissions,
    ) => Promise<{ approvedAccounts: Hex[]; approvedChainIds: Hex[] }>;
    sendMetrics: (
      payload: MetaMetricsEventPayload,
      options?: MetaMetricsEventOptions,
    ) => void;
    metamaskState: {
      metaMetricsId: string;
      permissionHistory: Record<string, unknown>;
      accounts: Record<string, unknown>;
    };
    grantPermissions: (
      ...args: Parameters<AbstractPermissionController['grantPermissions']>
    ) => Record<string, ValidPermission<string, Caveat<string, Json>>>;
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
      end(error as unknown as Error);
    } finally {
      locks.delete(origin);
    }
    return undefined;
  }

  let legacyApproval;
  try {
    legacyApproval = await requestPermissionApprovalForOrigin({
      [RestrictedMethods.eth_accounts]: {},
      ...(!isSnapId(origin) && {
        [PermissionNames.permittedChains]: {},
      }),
    });
  } catch (error) {
    return end(error as unknown as Error);
  }

  let caveatValue = {
    requiredScopes: {},
    optionalScopes: {},
    isMultichainOrigin: false,
  };

  if (!isSnapId(origin)) {
    caveatValue = setPermittedEthChainIds(
      caveatValue,
      legacyApproval.approvedChainIds,
    );
  }

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
