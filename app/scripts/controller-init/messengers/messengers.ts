import {
  getPPOMControllerMessenger,
  getPPOMControllerInitMessenger,
} from './ppom-controller-messenger';
import {
  getTransactionControllerMessenger,
  getTransactionControllerInitMessenger,
} from './transaction-controller-messenger';

export const messengers = {
  PPOMController: {
    getMessenger: getPPOMControllerMessenger,
    getInitMessenger: getPPOMControllerInitMessenger,
  },
  TransactionController: {
    getMessenger: getTransactionControllerMessenger,
    getInitMessenger: getTransactionControllerInitMessenger,
  },
} as const;
