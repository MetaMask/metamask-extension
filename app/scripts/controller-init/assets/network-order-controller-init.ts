import { SolScope } from '@metamask/keyring-api';
import { Hex, KnownCaipNamespace } from '@metamask/utils';
import {
  CHAIN_IDS,
  FEATURED_NETWORK_CHAIN_IDS,
} from '../../../../shared/constants/network';
import {
  NetworkOrderController,
  NetworkOrderControllerState,
} from '../../controllers/network-order';
import { NetworkOrderControllerMessenger } from '../messengers/assets';
import { ControllerInitFunction } from '../types';

const generateDefaultNetworkOrderControllerState =
  (): NetworkOrderControllerState => {
    if (
      process.env.METAMASK_DEBUG &&
      process.env.METAMASK_ENVIRONMENT === 'development' &&
      !process.env.IN_TEST
    ) {
      return {
        orderedNetworkList: [],
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            [CHAIN_IDS.SEPOLIA]: true,
          },
          [KnownCaipNamespace.Solana]: {
            [SolScope.Mainnet]: true,
          },
        },
      };
    }

    return {
      orderedNetworkList: [],
      enabledNetworkMap: {
        [KnownCaipNamespace.Eip155]: {
          [CHAIN_IDS.MAINNET]: true,
        },
        [KnownCaipNamespace.Solana]: {
          [SolScope.Mainnet]: true,
        },
      },
    };
  };

/**
 * Validates and fixes the network state after controller initialization
 *
 * @param controller - network order controller
 * @param currentlyAddedPopularNetworks - current popular networks added
 */
export const validateAndFixNetworkState = (
  controller: NetworkOrderController,
  currentlyAddedPopularNetworks: Hex[],
): void => {
  const { state } = controller;

  // ensure EVM only have 1 network or all currently added popular networks (cannot be in-between)
  if (!state?.enabledNetworkMap?.[KnownCaipNamespace.Eip155]) {
    controller.setEnabledNetworks(['0x1'], KnownCaipNamespace.Eip155);
    return;
  }

  const numberOfSelectedEvmNetworks = Object.keys(
    state?.enabledNetworkMap?.[KnownCaipNamespace.Eip155],
  );

  // ensure we have at least 1 network selected for EVM
  if (numberOfSelectedEvmNetworks.length === 0) {
    controller.setEnabledNetworks(['0x1'], KnownCaipNamespace.Eip155);
    return;
  }

  // if we have >1 network then ensure that it is all the popular networks (we cannot have an inbetween state)
  if (numberOfSelectedEvmNetworks.length > 1) {
    const arePopularNetworkListsEqual =
      numberOfSelectedEvmNetworks.length ===
        currentlyAddedPopularNetworks.length &&
      currentlyAddedPopularNetworks.every((chainId) =>
        numberOfSelectedEvmNetworks.includes(chainId),
      );

    if (!arePopularNetworkListsEqual) {
      controller.setEnabledNetworks(
        currentlyAddedPopularNetworks,
        KnownCaipNamespace.Eip155,
      );
    }
  }
};

export const NetworkOrderControllerInit: ControllerInitFunction<
  NetworkOrderController,
  NetworkOrderControllerMessenger
> = ({ controllerMessenger, persistedState, getController }) => {
  const controller = new NetworkOrderController({
    messenger: controllerMessenger,
    state: {
      ...generateDefaultNetworkOrderControllerState(),
      ...persistedState.NetworkOrderController,
    },
  });

  // after init (once constructor has finished)
  // validate state
  setTimeout(() => {
    const networkConfigs =
      getController('NetworkController').state.networkConfigurationsByChainId;
    const currentlyAddedPopularNetworks = FEATURED_NETWORK_CHAIN_IDS.filter(
      (chainId) => chainId in networkConfigs,
    );
    validateAndFixNetworkState(controller, currentlyAddedPopularNetworks);
  }, 0);

  return {
    controller,
  };
};
