import {
  getDefaultNetworkControllerState,
  NetworkConfiguration,
  NetworkController,
  RpcEndpointType,
  NetworkControllerMessenger,
} from '@metamask/network-controller';
import { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { SECOND } from '../../../shared/constants/time';
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

function getInitialState(initialState?: Partial<NetworkController['state']>) {
  let initialNetworkControllerState = initialState;

  if (!initialNetworkControllerState) {
    initialNetworkControllerState = getDefaultNetworkControllerState();

    const networks =
      initialNetworkControllerState.networkConfigurationsByChainId ?? {};

    let network: NetworkConfiguration;
    if (process.env.IN_TEST) {
      network = {
        chainId: CHAIN_IDS.LOCALHOST,
        name: 'Localhost 8545',
        nativeCurrency: 'ETH',
        blockExplorerUrls: [],
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [
          {
            networkClientId: 'networkConfigurationId',
            url: 'http://localhost:8545',
            type: RpcEndpointType.Custom,
            failoverUrls: [],
          },
        ],
      };
      networks[CHAIN_IDS.LOCALHOST] = network;
    } else if (
      process.env.METAMASK_DEBUG ||
      process.env.METAMASK_ENVIRONMENT === 'test'
    ) {
      network = networks[CHAIN_IDS.SEPOLIA];
    } else {
      network = networks[CHAIN_IDS.MAINNET];
    }

    initialNetworkControllerState.selectedNetworkClientId =
      network.rpcEndpoints[network.defaultRpcEndpointIndex].networkClientId;
  }

  return initialNetworkControllerState;
}

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
  const initialState = getInitialState(persistedState.NetworkController);

  /**
   * Determines if RPC failover is enabled based on RemoteFeatureFlagController
   * state.
   *
   * @param state - RemoteFeatureFlagControllerState
   * @returns true if RPC failover is enabled, false otherwise
   */
  const getIsRpcFailoverEnabled = (state: RemoteFeatureFlagControllerState) => {
    const walletFrameworkRpcFailoverEnabled = state.remoteFeatureFlags
      .walletFrameworkRpcFailoverEnabled as boolean | undefined;
    return walletFrameworkRpcFailoverEnabled ?? false;
  };

  const getBlockTrackerOptions = () => {
    return process.env.IN_TEST
      ? {}
      : {
          pollingInterval: 20 * SECOND,
          // The retry timeout is pretty short by default, and if the endpoint is
          // down, it will end up exhausting the max number of consecutive
          // failures quickly.
          retryTimeout: 20 * SECOND,
        };
  };

  const messengerClient = new NetworkController({
    messenger: controllerMessenger,
    state: initialState,
    infuraProjectId,
    getBlockTrackerOptions,
    failoverUrls: {
      [CHAIN_IDS.MAINNET]: getFailoverUrlsForInfuraNetwork('ethereum-mainnet'),
      [CHAIN_IDS.LINEA_MAINNET]:
        getFailoverUrlsForInfuraNetwork('linea-mainnet'),
      [CHAIN_IDS.BASE]: getFailoverUrlsForInfuraNetwork('base-mainnet'),
      [CHAIN_IDS.ARBITRUM]: getFailoverUrlsForInfuraNetwork('arbitrum-mainnet'),
      [CHAIN_IDS.OPTIMISM]: getFailoverUrlsForInfuraNetwork('optimism-mainnet'),
      [CHAIN_IDS.POLYGON]: getFailoverUrlsForInfuraNetwork('polygon-mainnet'),
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

  initMessenger.subscribe(
    'RemoteFeatureFlagController:stateChange',
    (isRpcFailoverEnabled) => {
      if (isRpcFailoverEnabled) {
        console.log('Enabling RPC failover.');
        messengerClient.enableRpcFailover();
      } else {
        console.log('Disabling RPC failover.');
        messengerClient.disableRpcFailover();
      }
    },
    getIsRpcFailoverEnabled,
  );

  return {
    messengerClient,
  };
};
