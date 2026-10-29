import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getNotificationServicesPushControllerMessenger,
  getNotificationServicesPushControllerInitMessenger,
} from './notification-services-push-controller-messenger';

describe('getNotificationServicesPushControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const authenticationControllerMessenger =
      getNotificationServicesPushControllerMessenger(messenger);

    expect(authenticationControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getNotificationServicesPushControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const authenticationControllerMessenger =
      getNotificationServicesPushControllerInitMessenger(messenger);

    expect(authenticationControllerMessenger).toBeInstanceOf(Messenger);
  });
});
