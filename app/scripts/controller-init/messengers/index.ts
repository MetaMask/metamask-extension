import { noop } from 'lodash';
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
import {
  getMultichainBalancesControllerMessenger,
  getMultichainTransactionsControllerMessenger,
  getMultichainAssetsControllerMessenger,
  getMultiChainAssetsRatesControllerMessenger,
} from './multichain';
import { noop } from 'lodash';

export const CONTROLLER_MESSENGERS = {
  CronjobController: {
    getMessenger: getCronjobControllerMessenger,
    getInitMessenger: noop,
  },
  ExecutionService: {
    getMessenger: getExecutionServiceMessenger,
    getInitMessenger: noop,
  },
  MultichainAssetsController: {
    getMessenger: getMultichainAssetsControllerMessenger,
    getInitMessenger: noop,
  },
  MultichainBalancesController: {
    getMessenger: getMultichainBalancesControllerMessenger,
    getInitMessenger: noop,
  },
  MultichainTransactionsController: {
    getMessenger: getMultichainTransactionsControllerMessenger,
    getInitMessenger: noop,
  },
  MultiChainAssetsRatesController: {
    getMessenger: getMultiChainAssetsRatesControllerMessenger,
    getInitMessenger: noop,
  },
  RateLimitController: {
    getMessenger: getRateLimitControllerMessenger,
    getInitMessenger: getRateLimitControllerInitMessenger,
  },
  SnapsRegistry: {
    getMessenger: getSnapsRegistryMessenger,
    getInitMessenger: noop,
  },
  SnapController: {
    getMessenger: getSnapControllerMessenger,
    getInitMessenger: getSnapControllerInitMessenger,
  },
  SnapInsightsController: {
    getMessenger: getSnapInsightsControllerMessenger,
    getInitMessenger: noop,
  },
  SnapInterfaceController: {
    getMessenger: getSnapInterfaceControllerMessenger,
    getInitMessenger: noop,
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
