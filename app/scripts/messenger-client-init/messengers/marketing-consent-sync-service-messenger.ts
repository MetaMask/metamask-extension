import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { MarketingConsentSyncServiceMessenger } from '@metamask/marketing-consent-sync-service';
import { RootMessenger } from '../../lib/messenger';

export type { MarketingConsentSyncServiceActions } from '@metamask/marketing-consent-sync-service';

/**
 * Get the messenger for the MarketingConsentSyncService. Delegates the
 * Authenticated User Storage, analytics, authentication and keyring access it
 * needs to keep marketing consent in sync with AUS.
 *
 * @param messenger - The root messenger.
 * @returns The MarketingConsentSyncServiceMessenger.
 */
export function getMarketingConsentSyncServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<MarketingConsentSyncServiceMessenger>,
    MessengerEvents<MarketingConsentSyncServiceMessenger>
  >,
): MarketingConsentSyncServiceMessenger {
  const controllerMessenger: MarketingConsentSyncServiceMessenger =
    new Messenger({
      namespace: 'MarketingConsentSyncService',
      parent: messenger,
    });

  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AuthenticatedUserStorageService:invalidateQueries',
      'AuthenticatedUserStorageService:getMarketingConsent',
      'AuthenticatedUserStorageService:putMarketingConsent',
      'AuthenticatedUserStorageService:getNotificationPreferences',
      'AuthenticatedUserStorageService:putNotificationPreferences',
      'AnalyticsController:getState',
      'AnalyticsController:optInToMarketing',
      'AnalyticsController:optOutOfMarketing',
      'AnalyticsController:applyRemoteMarketingConsent',
      'AnalyticsController:clearMarketingConsentSyncPending',
      'AuthenticationController:getState',
      'KeyringController:getState',
    ],
    events: [
      'AnalyticsController:stateChanged',
      'AuthenticationController:stateChanged',
      'KeyringController:lock',
      'KeyringController:unlock',
    ],
  });

  return controllerMessenger;
}
