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
  getMultichainNetworkControllerMessenger,
  getMultichainAssetsRatesControllerMessenger,
} from './multichain';
import { getInstitutionalSnapControllerMessenger } from './accounts/institutional-snap-controller-messenger';
import {
  getAuthenticationControllerMessenger,
  getUserStorageControllerMessenger,
} from './identity';
import {
  getAssetsContractControllerMessenger,
  getNftControllerMessenger,
  getNftDetectionControllerMessenger,
  getTokenRatesControllerMessenger,
} from './assets';
import {
  getNotificationServicesControllerMessenger,
  getNotificationServicesPushControllerMessenger,
} from './notifications';
import { getDeFiPositionsControllerMessenger } from './defi-positions';
import { getDeFiPositionsControllerInitMessenger } from './defi-positions/defi-positions-controller-messenger';

export const CONTROLLER_MESSENGERS = {
  AuthenticationController: {
    getMessenger: getAuthenticationControllerMessenger,
    getInitMessenger: noop,
  },
  CronjobController: {
    getMessenger: getCronjobControllerMessenger,
    getInitMessenger: noop,
  },
  DeFiPositionsController: {
    getMessenger: getDeFiPositionsControllerMessenger,
    getInitMessenger: getDeFiPositionsControllerInitMessenger,
  },
  ExecutionService: {
    getMessenger: getExecutionServiceMessenger,
    getInitMessenger: noop,
  },
  InstitutionalSnapController: {
    getMessenger: getInstitutionalSnapControllerMessenger,
    getInitMessenger: noop,
  },
  MultichainAssetsController: {
    getMessenger: getMultichainAssetsControllerMessenger,
    getInitMessenger: noop,
  },
  MultichainAssetsRatesController: {
    getMessenger: getMultichainAssetsRatesControllerMessenger,
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
  MultichainNetworkController: {
    getMessenger: getMultichainNetworkControllerMessenger,
    getInitMessenger: noop,
  },
  NotificationServicesController: {
    getMessenger: getNotificationServicesControllerMessenger,
    getInitMessenger: noop,
  },
  NotificationServicesPushController: {
    getMessenger: getNotificationServicesPushControllerMessenger,
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
  UserStorageController: {
    getMessenger: getUserStorageControllerMessenger,
    getInitMessenger: noop,
  },
  TokenRatesController: {
    getMessenger: getTokenRatesControllerMessenger,
    getInitMessenger: noop,
  },
  NftController: {
    getMessenger: getNftControllerMessenger,
    getInitMessenger: noop,
  },
  NftDetectionController: {
    getMessenger: getNftDetectionControllerMessenger,
    getInitMessenger: noop,
  },
  AssetsContractController: {
    getMessenger: getAssetsContractControllerMessenger,
    getInitMessenger: noop,
  },
} as const;
