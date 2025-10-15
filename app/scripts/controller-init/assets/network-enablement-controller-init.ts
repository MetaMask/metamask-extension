import {
  NetworkEnablementController,
  NetworkEnablementControllerState,
} from '@metamask/network-enablement-controller';
import { NetworkState } from '@metamask/network-controller';
import { MultichainNetworkControllerState } from '@metamask/multichain-network-controller';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  BtcScope,
  ///: END:ONLY_INCLUDE_IF
  SolScope,
} from '@metamask/keyring-api';
import {
  CaipChainId,
  CaipNamespace,
  Hex,
  KnownCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';
import { NetworkEnablementControllerMessenger } from '../messengers/assets';
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
    };
  } else if (
    process.env.METAMASK_DEBUG ||
    process.env.METAMASK_ENVIRONMENT === 'test'
  ) {
    return {
      enabledNetworkMap: {
        ...generateEVMNetworkMap(networkConfigurationsByChainId, [
          CHAIN_IDS.SEPOLIA,
        ]),
        ...generateMultichainNetworkMaps(
          multichainNetworkConfigurationsByChainId,
          [],
        ),
      },
    };
  }

  const enabledMultichainNetworks: string[] = [SolScope.Mainnet];

  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  enabledMultichainNetworks.push(BtcScope.Mainnet);
  ///: END:ONLY_INCLUDE_IF

  return {
    enabledNetworkMap: {
      ...generateEVMNetworkMap(
        networkConfigurationsByChainId,
        FEATURED_NETWORK_CHAIN_IDS,
      ),
      ...generateMultichainNetworkMaps(
        multichainNetworkConfigurationsByChainId,
        enabledMultichainNetworks,
      ),
    },
  };
};

export const NetworkEnablementControllerInit: ControllerInitFunction<
  NetworkEnablementController,
  NetworkEnablementControllerMessenger
> = ({ controllerMessenger, persistedState, getController }) => {
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

  return {
    controller,
  };
};
