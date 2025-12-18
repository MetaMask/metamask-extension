import {
  TransactionPayController,
  TransactionPayControllerMessenger,
  TransactionPayStrategy,
} from '@metamask/transaction-pay-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { ControllerInitFunction } from './types';
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

  return { controller };
};

function getStrategy(_transaction: TransactionMeta): TransactionPayStrategy {
  return TransactionPayStrategy.Relay;
}
