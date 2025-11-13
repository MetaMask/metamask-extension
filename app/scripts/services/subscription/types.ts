import { Messenger } from '@metamask/messenger';
import {
  SubscriptionControllerGetBillingPortalUrlAction,
  SubscriptionControllerGetCryptoApproveTransactionParamsAction,
  SubscriptionControllerGetPricingAction,
  SubscriptionControllerGetSubscriptionsAction,
  SubscriptionControllerStartShieldSubscriptionWithCardAction,
  SubscriptionControllerUpdatePaymentMethodAction,
  SubscriptionControllerSubmitSponsorshipIntentsAction,
} from '@metamask/subscription-controller';
import { AuthenticationControllerGetBearerToken } from '@metamask/profile-sync-controller/auth';
import {
  TransactionControllerGetTransactionsAction,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { AccountsControllerGetStateAction } from '@metamask/accounts-controller';
import { SmartTransactionsControllerGetStateAction } from '@metamask/smart-transactions-controller';
import { NetworkControllerGetStateAction } from '@metamask/network-controller';
import ExtensionPlatform from '../../platforms/extension';
import { WebAuthenticator } from '../oauth/types';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import { SwapsControllerGetStateAction } from '../../controllers/swaps/swaps.types';

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
  | TransactionControllerGetTransactionsAction
  | PreferencesControllerGetStateAction
  | AccountsControllerGetStateAction
  | SmartTransactionsControllerGetStateAction
  | SwapsControllerGetStateAction
  | NetworkControllerGetStateAction
  | AuthenticationControllerGetBearerToken;

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
