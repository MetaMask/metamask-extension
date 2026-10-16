import {
  MarketingConsentController,
  type MarketingConsentControllerMessenger,
} from '@metamask/marketing-consent-controller';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the MarketingConsentController, which keeps marketing consent
 * (held by AnalyticsController) in sync with Authenticated User Storage.
 *
 * It reads AnalyticsController, AuthenticationController and
 * KeyringController state on construction, so it must be initialized after
 * them.
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
