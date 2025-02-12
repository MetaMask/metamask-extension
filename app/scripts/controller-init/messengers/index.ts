import {
  getPPOMControllerMessenger,
  getPPOMControllerInitMessenger,
} from './ppom-controller-messenger';
import {
  getCronjobControllerMessenger,
  getExecutionServiceMessenger,
  getRateLimitControllerInitMessenger,
  getRateLimitControllerMessenger,
  getSnapControllerInitMessenger,
  getSnapControllerMessenger,
  getSnapInsightsControllerMessenger,
  getSnapInterfaceControllerMessenger,
  getSnapsRegistryMessenger,
} from './snaps';
import {
  getTransactionControllerMessenger,
  getTransactionControllerInitMessenger,
} from './transaction-controller-messenger';

export const CONTROLLER_MESSENGERS = {
  CronjobController: {
    getMessenger: getCronjobControllerMessenger,
  },
  ExecutionService: {
    getMessenger: getExecutionServiceMessenger,
  },
  RateLimitController: {
    getMessenger: getRateLimitControllerMessenger,
    getInitMessenger: getRateLimitControllerInitMessenger,
  },
  SnapsRegistry: {
    getMessenger: getSnapsRegistryMessenger,
  },
  SnapController: {
    getMessenger: getSnapControllerMessenger,
    getInitMessenger: getSnapControllerInitMessenger,
  },
  SnapInsightsController: {
    getMessenger: getSnapInsightsControllerMessenger,
  },
  SnapInterfaceController: {
    getMessenger: getSnapInterfaceControllerMessenger,
  },
  PPOMController: {
    getMessenger: getPPOMControllerMessenger,
    getInitMessenger: getPPOMControllerInitMessenger,
  },
  TransactionController: {
    getMessenger: getTransactionControllerMessenger,
    getInitMessenger: getTransactionControllerInitMessenger,
  },
} as const;
