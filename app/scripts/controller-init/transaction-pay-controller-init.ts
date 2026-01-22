import {
  TransactionPayController,
  TransactionPayControllerMessenger,
  TransactionPayStrategy,
} from '@metamask/transaction-pay-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { ControllerInitFunction, ControllerInitResult } from './types';
import type { TransactionPayControllerInitMessenger } from './messengers';

export const TransactionPayControllerInit: ControllerInitFunction<
  TransactionPayController,
  TransactionPayControllerMessenger,
  TransactionPayControllerInitMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new TransactionPayController({
    getDelegationTransaction: async () => {
      throw new Error('Delegation transaction not supported');
    },
    getStrategy,
    messenger: controllerMessenger,
    state: persistedState.TransactionPayController,
  });

  const api = getApi(controller);

  return { controller, api };
};

function getApi(
  controller: TransactionPayController,
): ControllerInitResult<TransactionPayController>['api'] {
  return {
    setTransactionPayIsMaxAmount: controller.setIsMaxAmount.bind(controller),
    updateTransactionPaymentToken:
      controller.updatePaymentToken.bind(controller),
  };
}

function getStrategy(_transaction: TransactionMeta): TransactionPayStrategy {
  return TransactionPayStrategy.Relay;
}
