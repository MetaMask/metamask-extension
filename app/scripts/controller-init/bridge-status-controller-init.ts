import { BridgeStatusController } from '@metamask/bridge-status-controller';
import { handleFetch } from '@metamask/controller-utils';
import { BridgeClientId } from '@metamask/bridge-controller';
import { trace } from '../../../shared/lib/trace';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { accountSupports7702 } from '../lib/account-supports-7702';
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
  const keyringController = getController('KeyringController');

  const controller = new BridgeStatusController({
    messenger: controllerMessenger,
    state: persistedState.BridgeStatusController,
    clientId: BridgeClientId.EXTENSION,
    fetchFn: async (url, requestOptions) => {
      return await handleFetch(url, {
        method: 'GET',
        ...requestOptions,
      });
    },
    addTransactionFn: (...args) =>
      transactionController.addTransaction(...args),
    addTransactionBatchFn: async (request, ...rest) => {
      const supports7702 = await accountSupports7702(
        request.from,
        keyringController as Parameters<typeof accountSupports7702>[1],
      );

      if (!supports7702) {
        return transactionController.addTransactionBatch(
          {
            ...request,
            isGasFeeSponsored: false,
            isGasFeeIncluded: false,
            disable7702: true,
          },
          ...rest,
        );
      }
      return transactionController.addTransactionBatch(request, ...rest);
    },
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
