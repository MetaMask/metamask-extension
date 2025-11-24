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
});
