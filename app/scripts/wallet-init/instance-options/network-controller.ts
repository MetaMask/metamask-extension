import { WalletOptions } from '@metamask/wallet';
import {
  CHAIN_IDS,
  getFailoverUrlsForInfuraNetwork,
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
    failoverUrls: {
      [CHAIN_IDS.MAINNET]: getFailoverUrlsForInfuraNetwork('ethereum-mainnet'),
      [CHAIN_IDS.LINEA_MAINNET]:
        getFailoverUrlsForInfuraNetwork('linea-mainnet'),
      [CHAIN_IDS.ARBITRUM]: getFailoverUrlsForInfuraNetwork('arbitrum-mainnet'),
      [CHAIN_IDS.AVALANCHE]:
        getFailoverUrlsForInfuraNetwork('avalanche-mainnet'),
      [CHAIN_IDS.OPTIMISM]: getFailoverUrlsForInfuraNetwork('optimism-mainnet'),
      [CHAIN_IDS.POLYGON]: getFailoverUrlsForInfuraNetwork('polygon-mainnet'),
      [CHAIN_IDS.BASE]: getFailoverUrlsForInfuraNetwork('base-mainnet'),
      [CHAIN_IDS.SEI]: getFailoverUrlsForInfuraNetwork('sei-mainnet'),
      [CHAIN_IDS.MONAD]: getFailoverUrlsForInfuraNetwork('monad-mainnet'),
      [CHAIN_IDS.HYPE]: getFailoverUrlsForInfuraNetwork('hyperevm-mainnet'),
      [CHAIN_IDS.ARC]: getFailoverUrlsForInfuraNetwork('arc-mainnet'),
    },
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
