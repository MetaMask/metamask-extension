import { rpcErrors } from '@metamask/rpc-errors';
import {
  JsonRpcParams,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import { AccountTrackerControllerState } from '@metamask/assets-controllers';
import { OriginString } from '@metamask/permission-controller';
import { PermissionLogControllerState } from '@metamask/permission-log-controller';

import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsControllerState } from '../../../controllers/metametrics-controller';
import { shouldEmitDappViewedEvent } from '../../util';
import {
  GetAccounts,
  GetUnlockPromise,
  HandlerWrapper,
  SendMetrics,
  RequestCaip25ApprovalForOrigin,
  GrantPermissionsForOrigin,
} from './types';

export type RequestEthereumAccountsOptions = {
  getAccounts: GetAccounts;
  getUnlockPromise: GetUnlockPromise;
  sendMetrics: SendMetrics;
  metamaskState: {
    metaMetricsId: MetaMetricsControllerState['metaMetricsId'];
    permissionHistory: PermissionLogControllerState['permissionHistory'];
    accounts: AccountTrackerControllerState['accounts'];
  };
  requestCaip25ApprovalForOrigin: RequestCaip25ApprovalForOrigin;
  grantPermissionsForOrigin: GrantPermissionsForOrigin;
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
      getUnlockPromise,
      sendMetrics,
      metamaskState,
    }: RequestEthereumAccountsOptions,
  ) => Promise<void>;
} & HandlerWrapper;

const requestEthereumAccounts = {
  methodNames: [MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS],
  implementation: requestEthereumAccountsHandler,
  hookNames: {
    getAccounts: true,
    getUnlockPromise: true,
    sendMetrics: true,
    metamaskState: true,
    requestCaip25ApprovalForOrigin: true,
    grantPermissionsForOrigin: true,
  },
} satisfies RequestEthereumAccountsConstraint;
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
 * @param options.requestCaip25ApprovalForOrigin - A hook that requests approval for the CAIP-25 permission for the origin.
 * @param options.grantPermissionsForOrigin - A hook that grants permission for the approved permissions for the origin.
 * @returns A promise that resolves to nothing
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
    getUnlockPromise,
    sendMetrics,
    metamaskState,
    requestCaip25ApprovalForOrigin,
    grantPermissionsForOrigin,
  }: RequestEthereumAccountsOptions,
) {
  const { origin } = req ?? {};
  if (locks.has(origin)) {
    res.error = rpcErrors.resourceUnavailable(
      `Already processing ${MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS}. Please wait.`,
    );
    return end();
  }

  let ethAccounts = await getAccounts({ ignoreLock: true });
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
    const caip25Approval = await requestCaip25ApprovalForOrigin();
    await grantPermissionsForOrigin(caip25Approval);
  } catch (error) {
    return end(error);
  }

  // We cannot derive ethAccounts directly from the CAIP-25 permission
  // because the accounts will not be in order of lastSelected
  ethAccounts = await getAccounts({ ignoreLock: true });

  // first time connection to dapp will lead to no log in the permissionHistory
  // and if user has connected to dapp before, the dapp origin will be included in the permissionHistory state
  // we will leverage that to identify `is_first_visit` for metrics
  if (shouldEmitDappViewedEvent(metamaskState.metaMetricsId ?? '')) {
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

  res.result = ethAccounts;
  return end();
}
