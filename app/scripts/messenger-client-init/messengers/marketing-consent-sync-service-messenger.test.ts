import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getMarketingConsentControllerMessenger } from './marketing-consent-controller-messenger';

describe('getMarketingConsentControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();

    expect(getMarketingConsentControllerMessenger(messenger)).toBeInstanceOf(
      Messenger,
    );
  });

  it('delegates the AUS, analytics, auth and keyring access the controller needs', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getMarketingConsentControllerMessenger(messenger);

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
