import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getNotificationServicesPushControllerMessenger } from './notification-services-push-controller-messenger';

describe('getAuthenticationControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const authenticationControllerMessenger =
      getNotificationServicesPushControllerMessenger(messenger);

    expect(authenticationControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
