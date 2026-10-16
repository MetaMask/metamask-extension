import {
  MarketingConsentController,
  type MarketingConsentControllerMessenger,
} from '@metamask/marketing-consent-controller';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the MarketingConsentController, which keeps marketing consent
 * (held by AnalyticsController) in sync with Authenticated User Storage.
 *
 * Construction doesn't call other controllers. `MetamaskController` calls
 * `initialize()` once every controller is registered, which reads
 * AnalyticsController, AuthenticationController and KeyringController state
 * and starts syncing.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to hydrate from.
 * @returns The initialized controller.
 */
export const MarketingConsentControllerInit: MessengerClientInitFunction<
  MarketingConsentController,
  MarketingConsentControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new MarketingConsentController({
    messenger: controllerMessenger,
    state: persistedState.MarketingConsentController,
    clientType: 'extension',
  });

  return { messengerClient };
};
