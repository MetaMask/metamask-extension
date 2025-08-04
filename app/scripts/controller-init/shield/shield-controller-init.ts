import {
  ShieldController,
  ShieldControllerMessenger,
} from '@metamask/shield-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { ControllerInitFunction } from '../types';

export const ShieldControllerInit: ControllerInitFunction<
  ShieldController,
  ShieldControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new ShieldController({
    messenger: controllerMessenger,
    state: persistedState.ShieldController,
    // mock backend
    backend: createMockBackend(),
  });

  controller.start();

  return {
    controller,
  };
};

function createMockBackend() {
  const statuses = ['covered', 'malicious', 'unsupported'] as const;
  const getRandomStatus = () =>
    statuses[Math.floor(Math.random() * statuses.length)];

  return {
    checkCoverage: (txMeta: TransactionMeta) => {
      return Promise.resolve({
        txId: txMeta.id,
        status: getRandomStatus(),
      });
    },
  };
}
