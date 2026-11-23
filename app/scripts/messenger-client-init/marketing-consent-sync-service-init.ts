import {
  MarketingConsentSyncService,
  type MarketingConsentSyncServiceMessenger,
} from '@metamask/marketing-consent-sync-service';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the MarketingConsentSyncService, which keeps marketing consent
 * (held by AnalyticsController) in sync with Authenticated User Storage.
 *
 * Construction doesn't call other controllers. `MetamaskController` calls
 * `initialize()` once every controller is registered, which reads
 * AnalyticsController, AuthenticationController and KeyringController state
 * and starts syncing.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const MarketingConsentSyncServiceInit: MessengerClientInitFunction<
  MarketingConsentSyncService,
  MarketingConsentSyncServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new MarketingConsentSyncService({
    messenger: controllerMessenger,
    clientType: 'extension',
  });

  return { messengerClient, persistedStateKey: null, memStateKey: null };
};
