import { Messenger } from '@metamask/messenger';

import { getRootMessenger } from '../../../lib/messenger';
import { getOAuthServiceMessenger } from './oauth-service-messenger';

describe('getOAuthServiceMessenger', () => {
  it('delegates the OAuth service dependencies without exposing access tokens', () => {
    const delegateSpy = jest.spyOn(Messenger.prototype, 'delegate');
    const messenger = getRootMessenger();
    const oauthServiceMessenger = getOAuthServiceMessenger(messenger);

    expect(oauthServiceMessenger).toBeInstanceOf(Messenger);
    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [
          'SeedlessOnboardingController:getState',
          'OnboardingController:getState',
          'GeolocationController:getGeolocation',
          'SentryTracingService:bufferedTrace',
          'SentryTracingService:bufferedEndTrace',
        ],
      }),
    );
    delegateSpy.mockRestore();
  });
});
