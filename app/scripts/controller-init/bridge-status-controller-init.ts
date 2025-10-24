import { BridgeStatusController } from '@metamask/bridge-status-controller';
import { handleFetch } from '@metamask/controller-utils';
import { trace } from '../../../shared/lib/trace';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { ControllerInitFunction } from './types';
import { BridgeStatusControllerMessenger } from './messengers';

/**
 * Initialize the bridge status controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.getController - Function to get other initialized controllers.
 * @param request.persistedState - The persisted state for the controller.
 * @returns The initialized controller.
 */
export const BridgeStatusControllerInit: ControllerInitFunction<
  BridgeStatusController,
  BridgeStatusControllerMessenger
> = ({ controllerMessenger, persistedState, getController }) => {
  const transactionController = getController('TransactionController');

  const controller = new BridgeStatusController({
    messenger: controllerMessenger,
    state: persistedState.BridgeStatusController,
    fetchFn: async (url, requestOptions) => {
      return await handleFetch(url, {
        method: 'GET',
        ...requestOptions,
      });
    },
    addTransactionFn: (...args) =>
      transactionController.addTransaction(...args),
    addTransactionBatchFn: (...args) =>
      transactionController.addTransactionBatch(...args),
    estimateGasFeeFn: (...args) =>
      transactionController.estimateGasFee(...args),
    updateTransactionFn: (...args) =>
      transactionController.updateTransaction(...args),

    config: {
      customBridgeApiBaseUrl: BRIDGE_API_BASE_URL,
    },

    // @ts-expect-error: `trace` function type does not match the expected type.
    traceFn: (...args) => trace(...args),
  });

  return {
    controller,
  };
};
