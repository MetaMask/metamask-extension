import { Messenger } from '@metamask/messenger';
import {
  SubscriptionControllerGetBillingPortalUrlAction,
  SubscriptionControllerGetCryptoApproveTransactionParamsAction,
  SubscriptionControllerGetPricingAction,
  SubscriptionControllerGetSubscriptionsAction,
  SubscriptionControllerStartShieldSubscriptionWithCardAction,
  SubscriptionControllerUpdatePaymentMethodAction,
  SubscriptionControllerSubmitSponsorshipIntentsAction,
  SubscriptionControllerGetStateAction,
  SubscriptionControllerLinkRewardsAction,
  SubscriptionControllerSubmitShieldSubscriptionCryptoApprovalAction,
} from '@metamask/subscription-controller';
import { AuthenticationControllerGetBearerToken } from '@metamask/profile-sync-controller/auth';
import {
  TransactionControllerGetTransactionsAction,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { AccountsControllerGetStateAction } from '@metamask/accounts-controller';
import { SmartTransactionsControllerGetStateAction } from '@metamask/smart-transactions-controller';
import { NetworkControllerGetStateAction } from '@metamask/network-controller';
import { KeyringControllerGetStateAction } from '@metamask/keyring-controller';
import ExtensionPlatform from '../../platforms/extension';
import { WebAuthenticator } from '../oauth/types';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import { SwapsControllerGetStateAction } from '../../controllers/swaps/swaps.types';
import {
  AppStateControllerGetStateAction,
  AppStateControllerSetPendingShieldCohortAction,
} from '../../controllers/app-state-controller';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller';
import {
  RewardsControllerGetHasAccountOptedInAction,
  RewardsControllerGetSeasonMetadataAction,
  RewardsControllerGetSeasonStatusAction,
} from '../../controllers/rewards/rewards-controller.types';

export const SERVICE_NAME = 'SubscriptionService';

export type ServiceName = typeof SERVICE_NAME;

export type SubscriptionServiceSubmitSubscriptionSponsorshipIntentAction = {
  type: `${ServiceName}:submitSubscriptionSponsorshipIntent`;
  handler: (txMeta: TransactionMeta) => Promise<void>;
};

export type SubscriptionServiceAction =
  | SubscriptionControllerGetPricingAction
  | SubscriptionControllerStartShieldSubscriptionWithCardAction
  | SubscriptionControllerUpdatePaymentMethodAction
  | SubscriptionControllerGetSubscriptionsAction
  | SubscriptionControllerGetCryptoApproveTransactionParamsAction
  | SubscriptionControllerGetBillingPortalUrlAction
  | SubscriptionControllerSubmitSponsorshipIntentsAction
  | SubscriptionServiceSubmitSubscriptionSponsorshipIntentAction
  | SubscriptionControllerGetStateAction
  | SubscriptionControllerLinkRewardsAction
  | SubscriptionControllerSubmitShieldSubscriptionCryptoApprovalAction
  | TransactionControllerGetTransactionsAction
  | PreferencesControllerGetStateAction
  | AccountsControllerGetStateAction
  | SmartTransactionsControllerGetStateAction
  | SwapsControllerGetStateAction
  | NetworkControllerGetStateAction
  | AuthenticationControllerGetBearerToken
  | AppStateControllerGetStateAction
  | AppStateControllerSetPendingShieldCohortAction
  | MetaMetricsControllerTrackEventAction
  | KeyringControllerGetStateAction // For metrics, to get the HD Keyrings metadata
  // Rewards Integration
  | RewardsControllerGetSeasonStatusAction // For rewards, to get the season status for claiming points with the shield subscription
  | RewardsControllerGetSeasonMetadataAction // For rewards, to check if the season is active and can claim points
  | RewardsControllerGetHasAccountOptedInAction; // For rewards, to check if the account has opted in to rewards

export type SubscriptionServiceEvent = never;

export type SubscriptionServiceMessenger = Messenger<
  ServiceName,
  SubscriptionServiceAction,
  SubscriptionServiceEvent
>;

export type SubscriptionServiceOptions = {
  /**
   * The messenger used to communicate with other services and controllers.
   */
  messenger: SubscriptionServiceMessenger;

  platform: ExtensionPlatform;

  webAuthenticator: WebAuthenticator;
};
