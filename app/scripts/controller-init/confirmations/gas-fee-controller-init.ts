import { GasFeeController } from '@metamask/gas-fee-controller';
import {
  GAS_API_BASE_URL,
  GAS_DEV_API_BASE_URL,
  SWAPS_CLIENT_ID,
} from '../../../../shared/constants/swaps';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  GasFeeControllerInitMessenger,
  GasFeeControllerMessenger,
} from '../messengers';
import { ControllerInitFunction } from '../types';

const GAS_API_URL = process.env.SWAPS_USE_DEV_APIS
  ? GAS_DEV_API_BASE_URL
  : GAS_API_BASE_URL;

/**
 * Initialize the gas fee controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger
 * @returns The initialized controller.
 */
export const GasFeeControllerInit: ControllerInitFunction<
  GasFeeController,
  GasFeeControllerMessenger,
  GasFeeControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  const getGlobalChainId = () => {
    // This replicates `#getGlobalChainId` in the `MetaMaskController`.
    const networkState = initMessenger.call('NetworkController:getState');
    const networkClientId = networkState.selectedNetworkClientId;

    const { chainId } = initMessenger.call(
      'NetworkController:getNetworkClientById',
      networkClientId,
    ).configuration;

    return chainId;
  };

  const controller = new GasFeeController({
    // @ts-expect-error: `GasFeeController` does not accept a partial state.
    state: persistedState.GasFeeController,
    messenger: controllerMessenger,
    interval: 10_000,
    clientId: SWAPS_CLIENT_ID,
    legacyAPIEndpoint: `${GAS_API_URL}/networks/<chain_id>/gasPrices`,
    EIP1559APIEndpoint: `${GAS_API_URL}/networks/<chain_id>/suggestedGasFees`,

    // @ts-expect-error: `provider` can be `undefined`, but `GasFeeController`
    // expects a defined value.
    getProvider: () => {
      const { provider } =
        initMessenger.call('NetworkController:getSelectedNetworkClient') ?? {};

      return provider;
    },

    onNetworkDidChange: (eventHandler) => {
      // TODO: The listener is never unsubscribed.
      initMessenger.subscribe('NetworkController:networkDidChange', () => {
        const state = initMessenger.call('NetworkController:getState');
        eventHandler(state);
      });
    },

    // @ts-expect-error: `NetworkController:getEIP1559Compatibility` can return
    // `undefined`, but `GasFeeController` expects a defined value.
    getCurrentNetworkEIP1559Compatibility: () => {
      return initMessenger.call('NetworkController:getEIP1559Compatibility');
    },

    getCurrentAccountEIP1559Compatibility: () => true,
    getCurrentNetworkLegacyGasAPICompatibility: () => {
      const chainId = getGlobalChainId();
      return chainId === CHAIN_IDS.BSC;
    },

    getChainId: getGlobalChainId,
  });

  return {
    controller,
  };
};
