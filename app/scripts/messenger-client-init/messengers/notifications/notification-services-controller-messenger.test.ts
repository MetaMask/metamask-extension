import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getNotificationServicesControllerMessenger } from './notification-services-controller-messenger';

describe('getAuthenticationControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const authenticationControllerMessenger =
      getNotificationServicesControllerMessenger(messenger);

    expect(authenticationControllerMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates the add push notification links action', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getNotificationServicesControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'NotificationServicesPushController:addPushNotificationLinks',
        ]),
      }),
    );
  });
});
