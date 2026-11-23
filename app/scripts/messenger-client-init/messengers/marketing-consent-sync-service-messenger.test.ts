import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getMarketingConsentSyncServiceMessenger } from './marketing-consent-sync-service-messenger';

describe('getMarketingConsentSyncServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();

    expect(getMarketingConsentSyncServiceMessenger(messenger)).toBeInstanceOf(
      Messenger,
    );
  });

  it('delegates the AUS, analytics, auth and keyring access the service needs', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getMarketingConsentSyncServiceMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
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
      }),
    );
  });
});
