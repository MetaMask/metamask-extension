import { WalletOptions } from '@metamask/wallet';
import { getFailoverUrlsByChainId } from '../../../../shared/constants/network-failover';
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
    failoverUrls: getFailoverUrlsByChainId(),
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
