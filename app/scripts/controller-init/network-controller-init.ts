import {
  getDefaultNetworkControllerState,
  NetworkConfiguration,
  NetworkController,
  RpcEndpointType,
} from '@metamask/network-controller';
import { BlockExplorerUrl, ChainId } from '@metamask/controller-utils';
import { hasProperty } from '@metamask/utils';
import { SECOND } from '../../../shared/constants/time';
import { getIsQuicknodeEndpointUrl } from '../../../shared/lib/network-utils';
import {
  onRpcEndpointDegraded,
  onRpcEndpointUnavailable,
} from '../lib/network-controller/messenger-action-handlers';
import {
  CHAIN_IDS,
  getFailoverUrlsForInfuraNetwork,
} from '../../../shared/constants/network';
import { captureException } from '../../../shared/lib/sentry';
import { ControllerInitFunction } from './types';
import {
  NetworkControllerInitMessenger,
  NetworkControllerMessenger,
} from './messengers';

export const ADDITIONAL_DEFAULT_NETWORKS = [
  ChainId['megaeth-testnet'],
  ChainId['monad-testnet'],
];

function getInitialState(initialState?: Partial<NetworkController['state']>) {
  let initialNetworkControllerState = initialState;

  if (!initialNetworkControllerState) {
    initialNetworkControllerState = getDefaultNetworkControllerState(
      ADDITIONAL_DEFAULT_NETWORKS,
    );

    const networks =
      initialNetworkControllerState.networkConfigurationsByChainId ?? {};

    // TODO: Consider changing `getDefaultNetworkControllerState` on the
    // controller side to include some of these tweaks.

    Object.values(networks).forEach((network) => {
      const id = network.rpcEndpoints[0].networkClientId;
      // Process only if the default network has a corresponding networkClientId
      // in BlockExplorerUrl.
      if (hasProperty(BlockExplorerUrl, id)) {
        network.blockExplorerUrls = [BlockExplorerUrl[id] as string];
      }
      network.defaultBlockExplorerUrlIndex = 0;
    });

    // Add failovers for default Infura RPC endpoints
    networks[CHAIN_IDS.MAINNET].rpcEndpoints[0].failoverUrls =
      getFailoverUrlsForInfuraNetwork('ethereum-mainnet');
    networks[CHAIN_IDS.LINEA_MAINNET].rpcEndpoints[0].failoverUrls =
      getFailoverUrlsForInfuraNetwork('linea-mainnet');
    networks[CHAIN_IDS.BASE].rpcEndpoints[0].failoverUrls =
      getFailoverUrlsForInfuraNetwork('base-mainnet');

    // Update default popular network names.
    networks[CHAIN_IDS.MAINNET].name = 'Ethereum';
    networks[CHAIN_IDS.LINEA_MAINNET].name = 'Linea';
    networks[CHAIN_IDS.BASE].name = 'Base';

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

  // Fix the network controller state (selectedNetworkClientId) if it is invalid and report the error
  if (
    initialNetworkControllerState.networkConfigurationsByChainId &&
    !Object.values(initialNetworkControllerState.networkConfigurationsByChainId)
      .flatMap((networkConfiguration) =>
        networkConfiguration.rpcEndpoints.map(
          (rpcEndpoint) => rpcEndpoint.networkClientId,
        ),
      )
      .includes(initialNetworkControllerState.selectedNetworkClientId as string)
  ) {
    captureException(
      new Error(
        `NetworkController state is invalid: \`selectedNetworkClientId\` '${initialNetworkControllerState.selectedNetworkClientId}' does not refer to an RPC endpoint within a network configuration`,
      ),
    );

    initialNetworkControllerState.selectedNetworkClientId =
      initialNetworkControllerState.networkConfigurationsByChainId[
        CHAIN_IDS.MAINNET
      ].rpcEndpoints[0].networkClientId;
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
export const NetworkControllerInit: ControllerInitFunction<
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

  const getRpcServiceOptions = (rpcEndpointUrl: string) => {
    const maxRetries = 4;
    const commonOptions = {
      fetch: globalThis.fetch.bind(globalThis),
      btoa: globalThis.btoa.bind(globalThis),
    };

    if (getIsQuicknodeEndpointUrl(rpcEndpointUrl)) {
      return {
        ...commonOptions,
        policyOptions: {
          maxRetries,
          // When we fail over to Quicknode, we expect it to be down at
          // first while it is being automatically activated. If an endpoint
          // is down, the failover logic enters a "cooldown period" of 30
          // minutes. We'd really rather not enter that for Quicknode, so
          // keep retrying longer.
          maxConsecutiveFailures: (maxRetries + 1) * 14,
        },
      };
    }

    return {
      ...commonOptions,
      policyOptions: {
        maxRetries,
        // Ensure that the circuit does not break too quickly.
        maxConsecutiveFailures: (maxRetries + 1) * 7,
      },
    };
  };

  const controller = new NetworkController({
    messenger: controllerMessenger,
    state: initialState,
    infuraProjectId,
    getBlockTrackerOptions,
    getRpcServiceOptions,
    additionalDefaultNetworks: ADDITIONAL_DEFAULT_NETWORKS,
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
        metaMetricsId: initMessenger.call(
          'MetaMetricsController:getMetaMetricsId',
        ),
      });
    },
  );

  initMessenger.subscribe(
    'NetworkController:rpcEndpointDegraded',
    async ({ chainId, endpointUrl, error }) => {
      onRpcEndpointDegraded({
        chainId,
        endpointUrl,
        error,
        infuraProjectId,
        trackEvent: initMessenger.call.bind(
          initMessenger,
          'MetaMetricsController:trackEvent',
        ),
        metaMetricsId: initMessenger.call(
          'MetaMetricsController:getMetaMetricsId',
        ),
      });
    },
  );

  controller.initializeProvider();

  return {
    controller,
  };
};
