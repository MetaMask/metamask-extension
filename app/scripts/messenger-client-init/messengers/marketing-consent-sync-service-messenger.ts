import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { MarketingConsentControllerMessenger } from '@metamask/marketing-consent-controller';
import { RootMessenger } from '../../lib/messenger';

export type {
  MarketingConsentControllerActions,
  MarketingConsentControllerEvents,
} from '@metamask/marketing-consent-controller';

/**
 * Get the messenger for the MarketingConsentController. Delegates the
 * Authenticated User Storage, analytics, authentication and keyring access it
 * needs to keep marketing consent in sync with AUS.
 *
 * @param messenger - The root messenger.
 * @returns The MarketingConsentControllerMessenger.
 */
export function getMarketingConsentControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<MarketingConsentControllerMessenger>,
    MessengerEvents<MarketingConsentControllerMessenger>
  >,
): MarketingConsentControllerMessenger {
  const controllerMessenger: MarketingConsentControllerMessenger =
    new Messenger({
      namespace: 'MarketingConsentController',
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
