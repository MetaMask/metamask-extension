import { MultichainTransactionsController } from '@metamask/multichain-transactions-controller';
import { ControllerInitFunction } from '../types';
import { MultichainTransactionsControllerInitMessenger } from '../messengers/multichain-transactions-controller-messenger';

// We are inferring the messenger type from the controllers constructor
// because the messenger is not exported from the package.
type MultichainTransactionsControllerMessenger = ConstructorParameters<
  typeof MultichainTransactionsController
>[0]['messenger'];

export const MultichainTransactionsControllerInit: ControllerInitFunction<
  MultichainTransactionsController,
  MultichainTransactionsControllerMessenger,
  MultichainTransactionsControllerInitMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new MultichainTransactionsController({
    messenger: controllerMessenger,
    state: persistedState.MultichainTransactionsController,
  });

  return {
    controller,
  };
};
