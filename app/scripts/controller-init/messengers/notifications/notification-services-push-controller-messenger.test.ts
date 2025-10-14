import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getNotificationServicesPushControllerMessenger,
  getNotificationServicesPushControllerInitMessenger,
} from './notification-services-push-controller-messenger';

describe('getNotificationServicesPushControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const authenticationControllerMessenger =
      getNotificationServicesPushControllerMessenger(messenger);

    expect(authenticationControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});

describe('getNotificationServicesPushControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const authenticationControllerMessenger =
      getNotificationServicesPushControllerInitMessenger(messenger);

    expect(authenticationControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
