import SwapsController from '../controllers/swaps';
import { ControllerInitFunction } from './types';
import {
  SwapsControllerInitMessenger,
  SwapsControllerMessenger,
} from './messengers';

/**
 * Initialize the swaps controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @param request.persistedState
 * @param request.getController
 * @returns The initialized controller.
 */
export const SwapsControllerInit: ControllerInitFunction<
  SwapsController,
  SwapsControllerMessenger,
  SwapsControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState, getController }) => {
  const gasFeeController = getController('GasFeeController');
  const transactionController = getController('TransactionController');

  const controller = new SwapsController(
    {
      messenger: controllerMessenger,

      // @ts-expect-error: Type of `simulationFails` does not match.
      getBufferedGasLimit: async (txMeta, multiplier) => {
        const networkState = initMessenger.call('NetworkController:getState');

        const { gas: gasLimit, simulationFails } =
          await transactionController.estimateGasBuffered(
            txMeta.txParams,
            multiplier,
            networkState.selectedNetworkClientId,
          );

        return { gasLimit, simulationFails };
      },

      // TODO: Remove once GasFeeController exports this action type
      getEIP1559GasFeeEstimates: (...args) =>
        gasFeeController.fetchGasFeeEstimates(...args),

      // TODO: Remove once TransactionController exports this action type.
      getLayer1GasFee: (...args) =>
        // @ts-expect-error: `getLayer1GasFee` can return undefined, but the
        // swaps controller expects a string.
        transactionController.getLayer1GasFee(...args),

      trackMetaMetricsEvent: initMessenger.call.bind(
        initMessenger,
        'MetaMetricsController:trackEvent',
      ),
    },
    persistedState.SwapsController,
  );

  return {
    controller,
  };
};
