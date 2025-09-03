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
import { rpcErrors } from '@metamask/rpc-errors';

import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import type { FlattenedBackgroundStateProxy } from '../../../../../shared/types';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../../shared/constants/metametrics';
import { shouldEmitDappViewedEvent } from '../../util';
import type {
  GetAccounts,
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
    'accounts' | 'metaMetricsId' | 'permissionHistory' | 'accountsByChainId'
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

// Used to rate-limit pending requests to one per origin
const locks = new Set();

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
  if (locks.has(origin)) {
    res.error = rpcErrors.resourceUnavailable(
      `Already processing ${MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS}. Please wait.`,
    );
    return end();
  }

  let ethAccounts = getAccounts(origin);
  if (ethAccounts.length > 0) {
    // We wait for the extension to unlock in this case only, because permission
    // requests are handled when the extension is unlocked, regardless of the
    // lock state when they were received.
    try {
      locks.add(origin);
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
    const caip25Permission =
      getCaip25PermissionFromLegacyPermissionsForOrigin();
    await requestPermissionsForOrigin(caip25Permission);
  } catch (error) {
    return end(error);
  }

  // We cannot derive ethAccounts directly from the CAIP-25 permission
  // because the accounts will not be in order of lastSelected
  ethAccounts = getAccounts(origin);

  // first time connection to dapp will lead to no log in the permissionHistory
  // and if user has connected to dapp before, the dapp origin will be included in the permissionHistory state
  // we will leverage that to identify `is_first_visit` for metrics
  if (shouldEmitDappViewedEvent(metamaskState.metaMetricsId)) {
    const isFirstVisit = !Object.keys(metamaskState.permissionHistory).includes(
      origin,
    );
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
          number_of_accounts: Object.keys(metamaskState.accounts).length,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          number_of_accounts_connected: ethAccounts.length,
        },
      },
      {
        excludeMetaMetricsId: true,
      },
    );
  }

  res.result = ethAccounts;
  return end();
}
