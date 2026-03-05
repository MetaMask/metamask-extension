import type {
  JsonRpcParams,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import type { OriginString } from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getEthAccounts,
} from '@metamask/chain-agnostic-permission';

import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import type { FlattenedBackgroundStateProxy } from '../../../../../shared/types';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../../shared/constants/metametrics';
import { shouldEmitDappViewedEvent } from '../../util';
import type {
  GetAccounts,
  GrantedPermissions,
  HandlerWrapper,
  SendMetrics,
  GetCaip25PermissionFromLegacyPermissionsForOrigin,
  RequestPermissionsForOrigin,
} from './types';

export type RequestEthereumAccountsOptions = {
  getAccounts: GetAccounts;
  sendMetrics: SendMetrics;
  metamaskState: Pick<
    FlattenedBackgroundStateProxy,
    'metaMetricsId' | 'permissionHistory' | 'identities'
  >;
  getCaip25PermissionFromLegacyPermissionsForOrigin: GetCaip25PermissionFromLegacyPermissionsForOrigin;
  requestPermissionsForOrigin: RequestPermissionsForOrigin;
};

type RequestEthereumAccountsConstraint<
  Params extends JsonRpcParams = JsonRpcParams,
> = {
  implementation: (
    req: JsonRpcRequest<Params> & { origin: OriginString },
    res: PendingJsonRpcResponse<string[]>,
    _next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
    {
      getAccounts,
      sendMetrics,
      metamaskState,
      getCaip25PermissionFromLegacyPermissionsForOrigin,
      requestPermissionsForOrigin,
    }: RequestEthereumAccountsOptions,
  ) => Promise<void>;
} & HandlerWrapper;

const requestEthereumAccounts = {
  methodNames: [MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS],
  implementation: requestEthereumAccountsHandler,
  hookNames: {
    getAccounts: true,
    sendMetrics: true,
    metamaskState: true,
    getCaip25PermissionFromLegacyPermissionsForOrigin: true,
    requestPermissionsForOrigin: true,
  },
} satisfies RequestEthereumAccountsConstraint;
export default requestEthereumAccounts;

// Tracks active eth_requestAccounts requests by origin so concurrent calls
// share the same in-flight request instead of competing for approvals.
const pendingRequests = new Map<OriginString, Promise<string[]>>();
const POST_APPROVAL_ACCOUNT_POLL_INTERVAL_MS = 50;
const POST_APPROVAL_ACCOUNT_POLL_TIMEOUT_MS = 1000;

function hasCaip25Scopes(
  value: unknown,
): value is Parameters<typeof getEthAccounts>[0] {
  return (
    value !== null &&
    typeof value === 'object' &&
    ('requiredScopes' in value || 'optionalScopes' in value)
  );
}

function getEthAccountsFromGrantedPermissions(
  grantedPermissions: GrantedPermissions,
): string[] {
  const caip25Permission = grantedPermissions[Caip25EndowmentPermissionName];
  if (!caip25Permission) {
    return [];
  }

  const caip25CaveatValue = caip25Permission.caveats?.find(
    ({ type }) => type === Caip25CaveatType,
  )?.value;

  if (!caip25CaveatValue) {
    return [];
  }

  if (!hasCaip25Scopes(caip25CaveatValue)) {
    return [];
  }

  return getEthAccounts(caip25CaveatValue);
}

/**
 * This method attempts to retrieve the Ethereum accounts available to the
 * requester, or initiate a request for account access if none are currently
 * available. It is essentially a wrapper of wallet_requestPermissions that
 * only errors if the user rejects the request. We maintain the method for
 * backwards compatibility reasons.
 *
 * @param req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param options - The RPC method hooks.
 * @param options.getAccounts - Gets the accounts for the requesting origin.
 * @param options.sendMetrics - submits a metametrics event, not waiting for it to complete or allowing its error to bubble up
 * @param options.metamaskState
 * @param options.getCaip25PermissionFromLegacyPermissionsForOrigin - A hook that returns a CAIP-25 permission from a legacy `eth_accounts` and `endowment:permitted-chains` permission.
 * @param options.requestPermissionsForOrigin - A hook that requests CAIP-25 permissions for the origin.
 */
async function requestEthereumAccountsHandler<
  Params extends JsonRpcParams = JsonRpcParams,
>(
  req: JsonRpcRequest<Params> & { origin: OriginString },
  res: PendingJsonRpcResponse<string[]>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    getAccounts,
    sendMetrics,
    metamaskState,
    getCaip25PermissionFromLegacyPermissionsForOrigin,
    requestPermissionsForOrigin,
  }: RequestEthereumAccountsOptions,
): Promise<void> {
  const { origin } = req ?? {};

  const inFlightRequest = pendingRequests.get(origin);
  if (inFlightRequest) {
    try {
      res.result = await inFlightRequest;
      return end();
    } catch (error) {
      return end(error);
    }
  }

  const requestPromise = (async () => {
    let ethAccounts = getAccounts(origin);
    if (ethAccounts.length === 0) {
      const caip25Permission =
        getCaip25PermissionFromLegacyPermissionsForOrigin();
      const [grantedPermissions] =
        await requestPermissionsForOrigin(caip25Permission);

      // We cannot derive ethAccounts directly from the CAIP-25 permission
      // because the accounts will not be in order of lastSelected
      ethAccounts = getAccounts(origin);

      // In some flows, approval resolves before account permissions are
      // observable via getAccounts(origin). Retry briefly to avoid returning
      // a transient empty result to the requesting dapp.
      if (ethAccounts.length === 0) {
        const timeoutAt = Date.now() + POST_APPROVAL_ACCOUNT_POLL_TIMEOUT_MS;
        while (ethAccounts.length === 0 && Date.now() < timeoutAt) {
          await new Promise((resolve) =>
            setTimeout(resolve, POST_APPROVAL_ACCOUNT_POLL_INTERVAL_MS),
          );
          ethAccounts = getAccounts(origin);
        }
      }

      // If state propagation still has not caught up, fall back to the
      // accounts in the granted CAIP-25 permission so eth_requestAccounts
      // does not return a transient empty result.
      if (ethAccounts.length === 0) {
        ethAccounts = getEthAccountsFromGrantedPermissions(grantedPermissions);
      }
    }

    // first time connection to dapp will lead to no log in the permissionHistory
    // and if user has connected to dapp before, the dapp origin will be included in the permissionHistory state
    // we will leverage that to identify `is_first_visit` for metrics
    if (shouldEmitDappViewedEvent(metamaskState.metaMetricsId)) {
      const isFirstVisit = !Object.keys(
        metamaskState.permissionHistory,
      ).includes(origin);
      sendMetrics(
        {
          event: MetaMetricsEventName.DappViewed,
          category: MetaMetricsEventCategory.InpageProvider,
          referrer: {
            url: origin,
          },
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_first_visit: isFirstVisit,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            number_of_accounts: Object.keys(metamaskState.identities).length,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            number_of_accounts_connected: ethAccounts.length,
          },
        },
        {
          excludeMetaMetricsId: true,
        },
      );
    }

    return ethAccounts;
  })();

  pendingRequests.set(origin, requestPromise);

  try {
    res.result = await requestPromise;
    return end();
  } catch (error) {
    return end(error);
  } finally {
    pendingRequests.delete(origin);
  }
}
