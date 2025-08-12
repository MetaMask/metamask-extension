import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getNotificationServicesControllerMessenger } from './notification-services-controller-messenger';

describe('getAuthenticationControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const authenticationControllerMessenger =
      getNotificationServicesControllerMessenger(messenger);

    expect(authenticationControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
