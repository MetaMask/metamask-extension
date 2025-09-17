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
  getSnapsNameProviderMessenger,
  getSnapsRegistryMessenger,
  getWebSocketServiceMessenger,
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
  getAuthenticationControllerInitMessenger,
  getAuthenticationControllerMessenger,
  getUserStorageControllerMessenger,
} from './identity';
import {
  getAssetsContractControllerMessenger,
  getNetworkOrderControllerMessenger,
  getNftControllerInitMessenger,
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
import {
  getDelegationControllerInitMessenger,
  getDelegationControllerMessenger,
} from './delegation/delegation-controller-messenger';
import {
  getAccountTreeControllerMessenger,
  getAccountTreeControllerInitMessenger,
  getMultichainAccountServiceMessenger,
} from './accounts';
import {
  getOAuthServiceMessenger,
  getSeedlessOnboardingControllerMessenger,
  getSeedlessOnboardingControllerInitMessenger,
} from './seedless-onboarding';
import {
  getSmartTransactionsControllerInitMessenger,
  getSmartTransactionsControllerMessenger,
} from './smart-transactions-controller-messenger';
import {
  getShieldControllerInitMessenger,
  getShieldControllerMessenger,
} from './shield/shield-controller-messenger';
import {
  getSubscriptionControllerInitMessenger,
  getSubscriptionControllerMessenger,
} from './subscription';
import { getGatorPermissionsControllerMessenger } from './gator-permissions/gator-permissions-controller-messenger';
import { getMetaMetricsControllerMessenger } from './metametrics-controller-messenger';
import { getUserStorageControllerInitMessenger } from './identity/user-storage-controller-messenger';
import {
  getTokenListControllerInitMessenger,
  getTokenListControllerMessenger,
} from './token-list-controller-messenger';
import {
  getTokenDetectionControllerInitMessenger,
  getTokenDetectionControllerMessenger,
} from './token-detection-controller-messenger';
import {
  getTokensControllerInitMessenger,
  getTokensControllerMessenger,
} from './tokens-controller-messenger';
import {
  getTokenBalancesControllerInitMessenger,
  getTokenBalancesControllerMessenger,
} from './token-balances-controller-messenger';
import { getRatesControllerMessenger } from './rates-controller-messenger';
import {
  getCurrencyRateControllerInitMessenger,
  getCurrencyRateControllerMessenger,
} from './currency-rate-controller-messenger';
import {
  getEnsControllerInitMessenger,
  getEnsControllerMessenger,
} from './ens-controller-messenger';
import {
  getNameControllerInitMessenger,
  getNameControllerMessenger,
} from './name-controller-messenger';
import {
  getGasFeeControllerInitMessenger,
  getGasFeeControllerMessenger,
} from './gas-fee-controller-messenger';
import { getSelectedNetworkControllerMessenger } from './selected-network-controller-messenger';
import {
  getAccountTrackerControllerInitMessenger,
  getAccountTrackerControllerMessenger,
} from './account-tracker-controller-messenger';
import { getOnboardingControllerMessenger } from './onboarding-controller-messenger';

export type {
  AccountTrackerControllerMessenger,
  AccountTrackerControllerInitMessenger,
} from './account-tracker-controller-messenger';
export {
  getAccountTrackerControllerMessenger,
  getAccountTrackerControllerInitMessenger,
} from './account-tracker-controller-messenger';
export type {
  CurrencyRateControllerMessenger,
  CurrencyRateControllerInitMessenger,
} from './currency-rate-controller-messenger';
export {
  getCurrencyRateControllerMessenger,
  getCurrencyRateControllerInitMessenger,
} from './currency-rate-controller-messenger';
export type {
  EnsControllerMessenger,
  EnsControllerInitMessenger,
} from './ens-controller-messenger';
export {
  getEnsControllerMessenger,
  getEnsControllerInitMessenger,
} from './ens-controller-messenger';
export type {
  GasFeeControllerMessenger,
  GasFeeControllerInitMessenger,
} from './gas-fee-controller-messenger';
export {
  getGasFeeControllerMessenger,
  getGasFeeControllerInitMessenger,
} from './gas-fee-controller-messenger';
export type { MetaMetricsControllerMessenger } from './metametrics-controller-messenger';
export { getMetaMetricsControllerMessenger } from './metametrics-controller-messenger';
export type { RatesControllerMessenger } from './rates-controller-messenger';
export { getRatesControllerMessenger } from './rates-controller-messenger';
export type {
  NameControllerMessenger,
  NameControllerInitMessenger,
} from './name-controller-messenger';
export {
  getNameControllerMessenger,
  getNameControllerInitMessenger,
} from './name-controller-messenger';
export type { OnboardingControllerMessenger } from './onboarding-controller-messenger';
export { getOnboardingControllerMessenger } from './onboarding-controller-messenger';
export type { SelectedNetworkControllerMessenger } from './selected-network-controller-messenger';
export { getSelectedNetworkControllerMessenger } from './selected-network-controller-messenger';
export type {
  TokenBalancesControllerMessenger,
  TokenBalancesControllerInitMessenger,
} from './token-balances-controller-messenger';
export {
  getTokenBalancesControllerMessenger,
  getTokenBalancesControllerInitMessenger,
} from './token-balances-controller-messenger';
export type {
  TokenDetectionControllerMessenger,
  TokenDetectionControllerInitMessenger,
} from './token-detection-controller-messenger';
export {
  getTokenDetectionControllerMessenger,
  getTokenDetectionControllerInitMessenger,
} from './token-detection-controller-messenger';
export type {
  TokenListControllerMessenger,
  TokenListControllerInitMessenger,
} from './token-list-controller-messenger';
export {
  getTokenListControllerMessenger,
  getTokenListControllerInitMessenger,
} from './token-list-controller-messenger';
export type {
  TokensControllerMessenger,
  TokensControllerInitMessenger,
} from './tokens-controller-messenger';
export {
  getTokensControllerMessenger,
  getTokensControllerInitMessenger,
} from './tokens-controller-messenger';

export const CONTROLLER_MESSENGERS = {
  AccountTrackerController: {
    getMessenger: getAccountTrackerControllerMessenger,
    getInitMessenger: getAccountTrackerControllerInitMessenger,
  },
  AuthenticationController: {
    getMessenger: getAuthenticationControllerMessenger,
    getInitMessenger: getAuthenticationControllerInitMessenger,
  },
  CronjobController: {
    getMessenger: getCronjobControllerMessenger,
    getInitMessenger: noop,
  },
  CurrencyRateController: {
    getMessenger: getCurrencyRateControllerMessenger,
    getInitMessenger: getCurrencyRateControllerInitMessenger,
  },
  DeFiPositionsController: {
    getMessenger: getDeFiPositionsControllerMessenger,
    getInitMessenger: getDeFiPositionsControllerInitMessenger,
  },
  DelegationController: {
    getMessenger: getDelegationControllerMessenger,
    getInitMessenger: getDelegationControllerInitMessenger,
  },
  EnsController: {
    getMessenger: getEnsControllerMessenger,
    getInitMessenger: getEnsControllerInitMessenger,
  },
  ExecutionService: {
    getMessenger: getExecutionServiceMessenger,
    getInitMessenger: noop,
  },
  GasFeeController: {
    getMessenger: getGasFeeControllerMessenger,
    getInitMessenger: getGasFeeControllerInitMessenger,
  },
  GatorPermissionsController: {
    getMessenger: getGatorPermissionsControllerMessenger,
    getInitMessenger: noop,
  },
  InstitutionalSnapController: {
    getMessenger: getInstitutionalSnapControllerMessenger,
    getInitMessenger: noop,
  },
  MetaMetricsController: {
    getMessenger: getMetaMetricsControllerMessenger,
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
  NameController: {
    getMessenger: getNameControllerMessenger,
    getInitMessenger: getNameControllerInitMessenger,
  },
  NotificationServicesController: {
    getMessenger: getNotificationServicesControllerMessenger,
    getInitMessenger: noop,
  },
  NotificationServicesPushController: {
    getMessenger: getNotificationServicesPushControllerMessenger,
    getInitMessenger: noop,
  },
  OAuthService: {
    getMessenger: getOAuthServiceMessenger,
    getInitMessenger: noop,
  },
  OnboardingController: {
    getMessenger: getOnboardingControllerMessenger,
    getInitMessenger: noop,
  },
  RateLimitController: {
    getMessenger: getRateLimitControllerMessenger,
    getInitMessenger: getRateLimitControllerInitMessenger,
  },
  RatesController: {
    getMessenger: getRatesControllerMessenger,
    getInitMessenger: noop,
  },
  SeedlessOnboardingController: {
    getMessenger: getSeedlessOnboardingControllerMessenger,
    getInitMessenger: getSeedlessOnboardingControllerInitMessenger,
  },
  SelectedNetworkController: {
    getMessenger: getSelectedNetworkControllerMessenger,
    getInitMessenger: noop,
  },
  ShieldController: {
    getMessenger: getShieldControllerMessenger,
    getInitMessenger: getShieldControllerInitMessenger,
  },
  SnapsNameProvider: {
    getMessenger: getSnapsNameProviderMessenger,
    getInitMessenger: noop,
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
  SubscriptionController: {
    getMessenger: getSubscriptionControllerMessenger,
    getInitMessenger: getSubscriptionControllerInitMessenger,
  },
  PPOMController: {
    getMessenger: getPPOMControllerMessenger,
    getInitMessenger: getPPOMControllerInitMessenger,
  },
  TokenBalancesController: {
    getMessenger: getTokenBalancesControllerMessenger,
    getInitMessenger: getTokenBalancesControllerInitMessenger,
  },
  TokenDetectionController: {
    getMessenger: getTokenDetectionControllerMessenger,
    getInitMessenger: getTokenDetectionControllerInitMessenger,
  },
  TokenListController: {
    getMessenger: getTokenListControllerMessenger,
    getInitMessenger: getTokenListControllerInitMessenger,
  },
  TokensController: {
    getMessenger: getTokensControllerMessenger,
    getInitMessenger: getTokensControllerInitMessenger,
  },
  TransactionController: {
    getMessenger: getTransactionControllerMessenger,
    getInitMessenger: getTransactionControllerInitMessenger,
  },
  UserStorageController: {
    getMessenger: getUserStorageControllerMessenger,
    getInitMessenger: getUserStorageControllerInitMessenger,
  },
  TokenRatesController: {
    getMessenger: getTokenRatesControllerMessenger,
    getInitMessenger: noop,
  },
  NftController: {
    getMessenger: getNftControllerMessenger,
    getInitMessenger: getNftControllerInitMessenger,
  },
  NftDetectionController: {
    getMessenger: getNftDetectionControllerMessenger,
    getInitMessenger: noop,
  },
  AssetsContractController: {
    getMessenger: getAssetsContractControllerMessenger,
    getInitMessenger: noop,
  },
  AccountTreeController: {
    getMessenger: getAccountTreeControllerMessenger,
    getInitMessenger: getAccountTreeControllerInitMessenger,
  },
  WebSocketService: {
    getMessenger: getWebSocketServiceMessenger,
    getInitMessenger: noop,
  },
  SmartTransactionsController: {
    getMessenger: getSmartTransactionsControllerMessenger,
    getInitMessenger: getSmartTransactionsControllerInitMessenger,
  },
  MultichainAccountService: {
    getMessenger: getMultichainAccountServiceMessenger,
    getInitMessenger: noop,
  },
  NetworkOrderController: {
    getMessenger: getNetworkOrderControllerMessenger,
    getInitMessenger: noop,
  },
} as const;
