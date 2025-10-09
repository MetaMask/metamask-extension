import {
  NetworkEnablementController,
  NetworkEnablementControllerState,
} from '@metamask/network-enablement-controller';
import { NetworkState } from '@metamask/network-controller';
import { MultichainNetworkControllerState } from '@metamask/multichain-network-controller';
import { BtcScope, SolAccountType, SolScope } from '@metamask/keyring-api';
import { KnownCaipNamespace } from '@metamask/utils';
import {
  NetworkEnablementControllerMessenger,
  NetworkEnablementControllerInitMessenger,
} from '../messengers/assets';
import { ControllerInitFunction } from '../types';
import {
  CHAIN_IDS,
  FEATURED_NETWORK_CHAIN_IDS,
} from '../../../../shared/constants/network';

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
): Record<string, boolean> => {
  const networkMap: Record<string, boolean> = {};

  // Add all available EVM networks from NetworkController with default disabled status
  Object.keys(networkConfigurationsByChainId).forEach((chainId) => {
    networkMap[chainId] = enabledChainIds.includes(chainId);
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
): Record<string, Record<string, boolean>> => {
  const networkMaps: Record<string, Record<string, boolean>> = {
    solana: {},
    bitcoin: {},
  };

  // Organize multichain networks by their prefix/type
  Object.keys(multichainNetworkConfigurationsByChainId).forEach((chainId) => {
    const isEnabled = enabledNetworks.includes(chainId);

    if (chainId.startsWith('solana:')) {
      networkMaps.solana[chainId] = isEnabled;
    } else if (chainId.startsWith('bip122:')) {
      networkMaps.bitcoin[chainId] = isEnabled;
    }
    // Add other network types as needed
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

  // Generate multichain network maps (always empty for all environments currently)
  const multichainMaps = generateMultichainNetworkMaps(
    multichainNetworkConfigurationsByChainId,
    [],
  );

  if (process.env.IN_TEST) {
    return {
      enabledNetworkMap: {
        eip155: generateEVMNetworkMap(networkConfigurationsByChainId, [
          CHAIN_IDS.LOCALHOST,
        ]),
        ...multichainMaps,
      },
    };
  } else if (
    process.env.METAMASK_DEBUG ||
    process.env.METAMASK_ENVIRONMENT === 'test'
  ) {
    return {
      enabledNetworkMap: {
        eip155: generateEVMNetworkMap(networkConfigurationsByChainId, [
          CHAIN_IDS.SEPOLIA,
        ]),
        ...multichainMaps,
      },
    };
  }

  return {
    enabledNetworkMap: {
      eip155: generateEVMNetworkMap(
        networkConfigurationsByChainId,
        FEATURED_NETWORK_CHAIN_IDS,
      ),
      ...multichainMaps,
    },
  };
};

export const NetworkEnablementControllerInit: ControllerInitFunction<
  NetworkEnablementController,
  NetworkEnablementControllerMessenger,
  NetworkEnablementControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState, getController }) => {
  const multichainNetworkControllerState = getController(
    'MultichainNetworkController',
  ).state;

  const networkControllerState = getController('NetworkController').state;

  const controller = new NetworkEnablementController({
    messenger: controllerMessenger,
    state: {
      ...generateDefaultNetworkEnablementControllerState(
        networkControllerState,
        multichainNetworkControllerState,
      ),
      ...persistedState.NetworkEnablementController,
    },
  });

  // TODO: Remove this after BIP-44 rollout.
  initMessenger.subscribe(
    'AccountsController:selectedAccountChange',
    (account) => {
      if (account.type === SolAccountType.DataAccount) {
        controller.enableNetworkInNamespace(
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

      ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
      const btcAccounts = initMessenger.call(
        'AccountTreeController:getAccountsFromSelectedAccountGroup',
        {
          scopes: [BtcScope.Mainnet],
        },
      );
      ///: END:ONLY_INCLUDE_IF(bitcoin)

      const allEnabledNetworks = Object.values(
        controller.state.enabledNetworkMap,
      ).reduce((acc, curr) => {
        return { ...acc, ...curr };
      }, {});

      if (Object.keys(allEnabledNetworks).length === 1) {
        const chainId = Object.keys(allEnabledNetworks)[0];

        let shouldEnableMainnetNetworks = false;
        if (chainId === SolScope.Mainnet && solAccounts.length === 0) {
          shouldEnableMainnetNetworks = true;
        }

        ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
        if (chainId === BtcScope.Mainnet && btcAccounts.length === 0) {
          shouldEnableMainnetNetworks = true;
        }
        ///: END:ONLY_INCLUDE_IF(bitcoin)

        if (shouldEnableMainnetNetworks) {
          controller.enableNetwork('0x1');
        }
      }
    },
  );

  return {
    controller,
  };
};
