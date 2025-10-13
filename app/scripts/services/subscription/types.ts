import { RestrictedMessenger } from '@metamask/base-controller';
import {
  SubscriptionControllerGetBillingPortalUrlAction,
  SubscriptionControllerGetCryptoApproveTransactionParamsAction,
  SubscriptionControllerGetPricingAction,
  SubscriptionControllerGetSubscriptionsAction,
  SubscriptionControllerStartShieldSubscriptionWithCardAction,
  SubscriptionControllerUpdatePaymentMethodAction,
} from '@metamask/subscription-controller';
import { AuthenticationControllerGetBearerToken } from '@metamask/profile-sync-controller/auth';
import ExtensionPlatform from '../../platforms/extension';
import { WebAuthenticator } from '../oauth/types';

export const SERVICE_NAME = 'SubscriptionService';

export type ServiceName = typeof SERVICE_NAME;

export type SubscriptionServiceAction =
  | SubscriptionControllerGetPricingAction
  | SubscriptionControllerStartShieldSubscriptionWithCardAction
  | SubscriptionControllerUpdatePaymentMethodAction
  | SubscriptionControllerGetSubscriptionsAction
  | SubscriptionControllerGetCryptoApproveTransactionParamsAction
  | SubscriptionControllerGetBillingPortalUrlAction
  | AuthenticationControllerGetBearerToken;

export type SubscriptionServiceEvent = never;

export type SubscriptionServiceMessenger = RestrictedMessenger<
  ServiceName,
  SubscriptionServiceAction,
  SubscriptionServiceEvent,
  SubscriptionServiceAction['type'],
  SubscriptionServiceEvent['type']
>;

export type SubscriptionServiceOptions = {
  /**
   * The messenger used to communicate with other services and controllers.
   */
  messenger: SubscriptionServiceMessenger;

  platform: ExtensionPlatform;

  webAuthenticator: WebAuthenticator;
};
