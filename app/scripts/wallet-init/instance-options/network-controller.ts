import { WalletOptions } from '@metamask/wallet';
import { Hex } from '@metamask/utils';
import {
  getFailoverUrlsForChainId,
  INFURA_NETWORK_NAME_BY_CHAIN_ID,
} from '../../../../shared/constants/network';
import {
  onRpcEndpointDegraded,
  onRpcEndpointUnavailable,
} from '../../lib/network-controller/messenger-action-handlers';
import {
  RootMessenger,
  RootMessengerActions,
  RootMessengerEvents,
} from '../../lib/messenger';

export function getNetworkControllerInstanceOptions(
  infuraProjectId: string,
): WalletOptions['instanceOptions']['networkController'] {
  return {
    infuraProjectId,
    failoverUrls: Object.fromEntries(
      (Object.keys(INFURA_NETWORK_NAME_BY_CHAIN_ID) as Hex[]).map((chainId) => [
        chainId,
        getFailoverUrlsForChainId(chainId) as string[],
      ]),
    ),
  };
}

// Temporary measure until we can move this into the controller
export function setupRpcEndpointMetrics(
  infuraProjectId: string,
  messenger: RootMessenger<RootMessengerActions, RootMessengerEvents>,
) {
  messenger.subscribe(
    'NetworkController:rpcEndpointUnavailable',
    async ({ chainId, endpointUrl, error }) => {
      onRpcEndpointUnavailable({
        chainId,
        endpointUrl,
        error,
        infuraProjectId,
        analyticsId: messenger.call('AnalyticsController:getState').analyticsId,
      });
    },
  );

  messenger.subscribe(
    'NetworkController:rpcEndpointDegraded',
    async ({
      chainId,
      duration,
      endpointUrl,
      error,
      rpcMethodName,
      traceId,
      type,
      retryReason,
    }) => {
      onRpcEndpointDegraded({
        chainId,
        duration,
        endpointUrl,
        error,
        infuraProjectId,
        retryReason,
        rpcMethodName,
        traceId,
        analyticsId: messenger.call('AnalyticsController:getState').analyticsId,
        type,
      });
    },
  );
}
