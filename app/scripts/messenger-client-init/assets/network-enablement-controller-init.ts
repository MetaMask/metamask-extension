import {
  NetworkEnablementController,
  NetworkEnablementControllerState,
  NetworkEnablementControllerMessenger,
} from '@metamask/network-enablement-controller';
import { selectEvmAutoEnabledNetworksChainIds } from '@metamask/config-registry-controller';
import { NetworkState } from '@metamask/network-controller';
import {
  MultichainNetworkControllerState,
  toEvmCaipChainId,
} from '@metamask/multichain-network-controller';
import {
  BtcScope,
  SolAccountType,
  SolScope,
  TrxScope,
} from '@metamask/keyring-api';
import {
  CaipChainId,
  CaipNamespace,
  Hex,
  KnownCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';
import { NetworkEnablementControllerInitMessenger } from '../messengers/assets';
import { MessengerClientInitFunction } from '../types';
import { CHAIN_IDS } from '../../../../shared/constants/network';

/**
 * Generates a map of EVM chain IDs to their enabled status based on NetworkController state.
 *
 * @param networkConfigurationsByChainId - The network configurations from NetworkController
 * @param enabledChainIds - Array of chain IDs that should be enabled
 * @returns Record mapping chain IDs to boolean enabled status
 */
const generateEVMNetworkMap = (
  networkConfigurationsByChainId: NetworkState['networkConfigurationsByChainId'],
  enabledChainIds: string[],
): Record<KnownCaipNamespace.Eip155, Record<Hex, boolean>> => {
  const networkMap: Record<KnownCaipNamespace.Eip155, Record<Hex, boolean>> = {
    [KnownCaipNamespace.Eip155]: {},
  };

  (Object.keys(networkConfigurationsByChainId) as Hex[]).forEach((chainId) => {
    networkMap[KnownCaipNamespace.Eip155][chainId] =
      enabledChainIds.includes(chainId);
  });

  return networkMap;
};

/**
 * Generates a map of multichain networks organized by network type based on MultichainNetworkController state.
 *
 * @param multichainNetworkConfigurationsByChainId - The multichain network configurations
 * @param enabledNetworks - Array of network IDs that should be enabled (empty by default)
 * @returns Record mapping network types to their network maps
 */
const generateMultichainNetworkMaps = (
  multichainNetworkConfigurationsByChainId: MultichainNetworkControllerState['multichainNetworkConfigurationsByChainId'],
  enabledNetworks: string[] = [],
): Record<CaipNamespace, Record<CaipChainId, boolean>> => {
  const networkMaps: Record<CaipNamespace, Record<CaipChainId, boolean>> = {};

  (
    Object.keys(multichainNetworkConfigurationsByChainId) as CaipChainId[]
  ).forEach((chainId) => {
    const isEnabled = enabledNetworks.includes(chainId);
    const { namespace } = parseCaipChainId(chainId);

    (networkMaps[namespace] ??= {})[chainId] = isEnabled;
  });

  return networkMaps;
};

const generateDefaultNetworkEnablementControllerState = (
  networkControllerState: NetworkState,
  multichainNetworkControllerState: MultichainNetworkControllerState,
): NetworkEnablementControllerState => {
  const { networkConfigurationsByChainId } = networkControllerState;
  const { multichainNetworkConfigurationsByChainId } =
    multichainNetworkControllerState;

  if (process.env.IN_TEST) {
    return {
      enabledNetworkMap: {
        ...generateEVMNetworkMap(networkConfigurationsByChainId, [
          CHAIN_IDS.LOCALHOST,
        ]),
        ...generateMultichainNetworkMaps(
          multichainNetworkConfigurationsByChainId,
          [],
        ),
      },
      nativeAssetIdentifiers: {},
    };
  }

  return {
    enabledNetworkMap: {
      ...generateEVMNetworkMap(networkConfigurationsByChainId, []),
      ...generateMultichainNetworkMaps(
        multichainNetworkConfigurationsByChainId,
        [],
      ),
    },
    nativeAssetIdentifiers: {},
  };
};

const AUTO_ENABLE_TIMEOUT_MS = 30_000;

function cloneEnabledNetworkMap(
  enabledNetworkMap: NetworkEnablementControllerState['enabledNetworkMap'],
): NetworkEnablementControllerState['enabledNetworkMap'] {
  return Object.fromEntries(
    Object.entries(enabledNetworkMap).map(([namespace, networks]) => [
      namespace,
      { ...networks },
    ]),
  ) as NetworkEnablementControllerState['enabledNetworkMap'];
}

export const NetworkEnablementControllerInit: MessengerClientInitFunction<
  NetworkEnablementController,
  NetworkEnablementControllerMessenger,
  NetworkEnablementControllerInitMessenger
> = ({
  controllerMessenger,
  initMessenger,
  persistedState,
  getMessengerClient,
}) => {
  const multichainNetworkControllerState = getMessengerClient(
    'MultichainNetworkController',
  ).state;

  const networkControllerState = getMessengerClient('NetworkController').state;

  const messengerClient = new NetworkEnablementController({
    messenger: controllerMessenger,
    state: {
      ...generateDefaultNetworkEnablementControllerState(
        networkControllerState,
        multichainNetworkControllerState,
      ),
      ...persistedState.NetworkEnablementController,
    },
  });

  if (
    !process.env.IN_TEST &&
    !persistedState.NetworkEnablementController?.enabledNetworkMap
  ) {
    messengerClient.enableAllPopularNetworks();
  }

  controllerMessenger.subscribe(
    'NetworkController:networkAdded',
    async ({ chainId }) => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      try {
        const autoEnabledNetworkChainIds = selectEvmAutoEnabledNetworksChainIds(
          controllerMessenger.call('ConfigRegistryController:getState'),
        );

        if (!autoEnabledNetworkChainIds.includes(toEvmCaipChainId(chainId))) {
          return;
        }

        const previousEnabledNetworkMap = cloneEnabledNetworkMap(
          messengerClient.state.enabledNetworkMap,
        );

        await Promise.race([
          controllerMessenger.waitUntil(
            'NetworkEnablementController:stateChange',
            {
              condition: (state) =>
                state.enabledNetworkMap.eip155?.[chainId] === true,
            },
          ),
          new Promise<never>((_resolve, reject) => {
            timeoutId = setTimeout(
              () =>
                reject(
                  new Error(`Timed out waiting for ${chainId} to be enabled`),
                ),
              AUTO_ENABLE_TIMEOUT_MS,
            );
          }),
        ]);
        messengerClient.restoreEnabledNetworkMap(previousEnabledNetworkMap);
      } catch (error) {
        controllerMessenger.captureException?.(
          error instanceof Error ? error : new Error(String(error)),
        );
      } finally {
        clearTimeout(timeoutId);
      }
    },
  );

  // Initialize native asset identifiers from network configurations.
  // This reads from NetworkController and MultichainNetworkController to populate
  // the nativeAssetIdentifiers state with CAIP-19-like identifiers for each network.
  // We intentionally don't await this - it will complete in the background.
  messengerClient.init();

  // TODO: Remove this after BIP-44 rollout.
  initMessenger.subscribe(
    'AccountsController:selectedAccountChange',
    (account) => {
      if (account.type === SolAccountType.DataAccount) {
        messengerClient.enableNetworkInNamespace(
          SolScope.Mainnet,
          KnownCaipNamespace.Solana,
        );
      }
    },
  );

  initMessenger.subscribe(
    'AccountTreeController:selectedAccountGroupChange',
    () => {
      const solAccounts = initMessenger.call(
        'AccountTreeController:getAccountsFromSelectedAccountGroup',
        {
          scopes: [SolScope.Mainnet],
        },
      );
      const btcAccounts = initMessenger.call(
        'AccountTreeController:getAccountsFromSelectedAccountGroup',
        {
          scopes: [BtcScope.Mainnet],
        },
      );
      const trxAccounts = initMessenger.call(
        'AccountTreeController:getAccountsFromSelectedAccountGroup',
        {
          scopes: [TrxScope.Mainnet],
        },
      );

      const allEnabledNetworks = {};

      for (const network of Object.values(
        messengerClient.state.enabledNetworkMap,
      )) {
        Object.assign(allEnabledNetworks, network);
      }

      if (Object.keys(allEnabledNetworks).length === 1) {
        const chainId = Object.keys(allEnabledNetworks)[0];

        let shouldEnableMainnetNetworks = false;
        if (chainId === SolScope.Mainnet && solAccounts.length === 0) {
          shouldEnableMainnetNetworks = true;
        }
        if (chainId === BtcScope.Mainnet && btcAccounts.length === 0) {
          shouldEnableMainnetNetworks = true;
        }
        if (chainId === TrxScope.Mainnet && trxAccounts.length === 0) {
          shouldEnableMainnetNetworks = true;
        }
        if (shouldEnableMainnetNetworks) {
          messengerClient.enableNetwork('0x1');
        }
      }
    },
  );

  return {
    messengerClient,
  };
};
