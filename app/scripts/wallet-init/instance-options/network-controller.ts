import { Messenger } from '@metamask/messenger';
import { NetworkController } from '@metamask/network-controller';
import type {
  NetworkControllerMessenger,
  NetworkControllerOptions,
} from '@metamask/network-controller';
import type {
  DefaultActions,
  DefaultEvents,
  RootMessenger as WalletRootMessenger,
  WalletOptions,
} from '@metamask/wallet';
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

type ExtensionNetworkControllerInstanceOptions =
  WalletOptions['instanceOptions']['networkController'] &
    Pick<NetworkControllerOptions, 'getRpcServiceOptions'>;

export type NetworkControllerInitializationConfiguration = {
  name: 'NetworkController';
  init({
    state,
    messenger,
    options,
  }: {
    state: NetworkControllerOptions['state'];
    messenger: NetworkControllerMessenger;
    options: ExtensionNetworkControllerInstanceOptions;
  }): NetworkController;
  getMessenger(
    parent: WalletRootMessenger<DefaultActions, DefaultEvents>,
  ): NetworkControllerMessenger;
};

export function getNetworkControllerInstanceOptions(
  infuraProjectId: string,
): ExtensionNetworkControllerInstanceOptions {
  const fetchFunction = globalThis.fetch.bind(globalThis);
  const btoaFunction = globalThis.btoa.bind(globalThis);

  return {
    infuraProjectId,
    getRpcServiceOptions: () => ({
      fetch: fetchFunction,
      btoa: btoaFunction,
    }),
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

export function getNetworkControllerInitializationConfiguration(): NetworkControllerInitializationConfiguration {
  return {
    name: 'NetworkController',
    init: ({ state, messenger, options }) =>
      new NetworkController({
        state,
        messenger,
        ...options,
      }),
    getMessenger: (
      parent: WalletRootMessenger<DefaultActions, DefaultEvents>,
    ) => {
      const networkControllerMessenger = new Messenger({
        namespace: 'NetworkController',
        parent,
      });

      // Mirrors the wallet package's default NetworkController messenger wiring.
      (
        parent as unknown as {
          delegate(args: {
            messenger: NetworkControllerMessenger;
            actions: string[];
            events: string[];
          }): void;
        }
      ).delegate({
        messenger: networkControllerMessenger,
        actions: [
          'ConnectivityController:getState',
          'RemoteFeatureFlagController:getState',
        ],
        events: ['RemoteFeatureFlagController:stateChange'],
      });

      return networkControllerMessenger;
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
