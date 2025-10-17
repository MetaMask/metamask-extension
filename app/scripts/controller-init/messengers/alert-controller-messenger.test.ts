import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getAlertControllerMessenger } from './alert-controller-messenger';

describe('getAlertControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const alertControllerMessenger = getAlertControllerMessenger(messenger);

    expect(alertControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
