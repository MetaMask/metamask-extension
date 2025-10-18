import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getAccountActivityServiceMessenger } from './account-activity-service-messenger';

describe('getAccountActivityServiceMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = new Messenger<never, never>();
    const messenger = getAccountActivityServiceMessenger(controllerMessenger);

    expect(messenger).toBeInstanceOf(RestrictedMessenger);
    expect(messenger).toBeDefined();
  });
});
