import {
  NetworkController,
  NetworkControllerMessenger,
} from '@metamask/network-controller';
import {
  onRpcEndpointDegraded,
  onRpcEndpointUnavailable,
} from '../lib/network-controller/messenger-action-handlers';
import {
  CHAIN_IDS,
  getFailoverUrlsForInfuraNetwork,
} from '../../../shared/constants/network';
import { MessengerClientInitFunction } from './types';
import { NetworkControllerInitMessenger } from './messengers';

/**
 * Initialize the network controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.infuraProjectId - The Infura project ID to use.
 * @param request.initMessenger
 * @returns The initialized controller.
 */
export const NetworkControllerInit: MessengerClientInitFunction<
  NetworkController,
  NetworkControllerMessenger,
  NetworkControllerInitMessenger
> = ({
  controllerMessenger,
  infuraProjectId,
  initMessenger,
  persistedState,
}) => {
  const messengerClient = new NetworkController({
    messenger: controllerMessenger,
    state: persistedState.NetworkController,
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
  });

  initMessenger.subscribe(
    'NetworkController:rpcEndpointUnavailable',
    async ({ chainId, endpointUrl, error }) => {
      onRpcEndpointUnavailable({
        chainId,
        endpointUrl,
        error,
        infuraProjectId,
        trackEvent: initMessenger.call.bind(
          initMessenger,
          'MetaMetricsController:trackEvent',
        ),
        analyticsId: initMessenger.call('AnalyticsController:getState')
          .analyticsId,
      });
    },
  );

  initMessenger.subscribe(
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
        trackEvent: initMessenger.call.bind(
          initMessenger,
          'MetaMetricsController:trackEvent',
        ),
        analyticsId: initMessenger.call('AnalyticsController:getState')
          .analyticsId,
        type,
      });
    },
  );

  messengerClient.init();

  return {
    messengerClient,
  };
};
