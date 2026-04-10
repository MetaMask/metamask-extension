import {
  TransactionPayController,
  TransactionPayControllerMessenger,
  TransactionPayStrategy,
} from '@metamask/transaction-pay-controller';
import type {
  TransactionController,
  TransactionMeta,
} from '@metamask/transaction-controller';
import {
  type DelegationMessenger,
  getDelegationTransaction,
} from '../lib/transaction/delegation';
import type { ControllerInitFunction, ControllerInitResult } from './types';
import type { TransactionPayControllerInitMessenger } from './messengers';

export const TransactionPayControllerInit: ControllerInitFunction<
  TransactionPayController,
  TransactionPayControllerMessenger,
  TransactionPayControllerInitMessenger
> = (request) => {
  const { controllerMessenger, initMessenger, persistedState } = request;

  const getTransactionController = () =>
    request.getController('TransactionController') as TransactionController;

  const getDelegationTransactionCallback: (request: {
    transaction: TransactionMeta;
  }) => ReturnType<typeof getDelegationTransaction> = ({ transaction }) =>
    getDelegationTransaction(
      {
        isAtomicBatchSupported:
          getTransactionController().isAtomicBatchSupported.bind(
            getTransactionController(),
          ),
        messenger: initMessenger as DelegationMessenger,
      },
      transaction,
    );

  const controller = new TransactionPayController({
    getDelegationTransaction: getDelegationTransactionCallback,
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
    setTransactionPayIsMaxAmount: (
      transactionId: string,
      isMaxAmount: boolean,
    ) => {
      controller.setTransactionConfig(transactionId, (config) => {
        config.isMaxAmount = isMaxAmount;
      });
    },
    updateTransactionPaymentToken:
      controller.updatePaymentToken.bind(controller),
  };
}

function getStrategy(_transaction: TransactionMeta): TransactionPayStrategy {
  return TransactionPayStrategy.Relay;
}
