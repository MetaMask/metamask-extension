import { rpcErrors } from '@metamask/rpc-errors';
import {
  Caip25CaveatType,
  Caip25CaveatValue,
  Caip25EndowmentPermissionName,
} from '@metamask/multichain';
import {
  Caveat,
  RequestedPermissions,
  ValidPermission,
} from '@metamask/permission-controller';
import {
  JsonRpcParams,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
  MetaMetricsEventPayload,
  MetaMetricsEventOptions,
} from '../../../../../shared/constants/metametrics';
import { shouldEmitDappViewedEvent } from '../../util';

const requestEthereumAccounts = {
  methodNames: [MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS],
  implementation: requestEthereumAccountsHandler,
  hookNames: {
    getAccounts: true,
    getUnlockPromise: true,
    sendMetrics: true,
    metamaskState: true,
    requestCaip25PermissionForOrigin: true,
  },
};
export default requestEthereumAccounts;

// Used to rate-limit pending requests to one per origin
const locks = new Set();

/**
 * This method attempts to retrieve the Ethereum accounts available to the
 * requester, or initiate a request for account access if none are currently
 * available. It is essentially a wrapper of wallet_requestPermissions that
 * only errors if the user rejects the request. We maintain the method for
 * backwards compatibility reasons.
 *
 * @param req - The JsonRpcEngine request
 * @param res - The JsonRpcEngine result object
 * @param _next - JsonRpcEngine next() callback - unused
 * @param end - JsonRpcEngine end() callback
 * @param options - Method hooks passed to the method implementation
 * @param options.getAccounts - A hook that returns the permitted eth accounts for the origin sorted by lastSelected.
 * @param options.getUnlockPromise - A hook that resolves when the wallet is unlocked.
 * @param options.sendMetrics - A hook that helps track metric events.
 * @param options.metamaskState - The MetaMask app state.
 * @param options.requestCaip25PermissionForOrigin - A hook that requests the CAIP-25 permission for the origin.
 * @param options.metamaskState.metaMetricsId - The MetaMetrics ID.
 * @param options.metamaskState.permissionHistory - The permission history keyed by origin.
 * @param options.metamaskState.accounts - The accounts available in the wallet keyed by address.
 * @returns A promise that resolves to nothing
 */
async function requestEthereumAccountsHandler(
  req: JsonRpcRequest<JsonRpcParams> & { origin: string },
  res: PendingJsonRpcResponse<string[]>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    getAccounts,
    getUnlockPromise,
    sendMetrics,
    metamaskState,
    requestCaip25PermissionForOrigin,
  }: {
    getAccounts: (ignoreLock?: boolean) => string[];
    getUnlockPromise: (shouldShowUnlockRequest: true) => Promise<void>;
    sendMetrics: (
      payload: MetaMetricsEventPayload,
      options?: MetaMetricsEventOptions,
    ) => void;
    metamaskState: {
      metaMetricsId: string;
      permissionHistory: Record<string, unknown>;
      accounts: Record<string, unknown>;
    };
    requestCaip25PermissionForOrigin: (
      requestedPermissions?: RequestedPermissions,
    ) => Promise<
      ValidPermission<
        typeof Caip25EndowmentPermissionName,
        Caveat<typeof Caip25CaveatType, Caip25CaveatValue>
      >
    >;
  },
) {
  const { origin } = req;
  if (locks.has(origin)) {
    res.error = rpcErrors.resourceUnavailable(
      `Already processing ${MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS}. Please wait.`,
    );
    return end();
  }

  let ethAccounts = getAccounts(true);
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

  try {
    await requestCaip25PermissionForOrigin();
  } catch (error) {
    return end(error as unknown as Error);
  }

  ethAccounts = getAccounts(true);
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
