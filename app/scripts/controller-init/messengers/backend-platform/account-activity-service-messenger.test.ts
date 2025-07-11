import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getAccountActivityServiceMessenger } from './account-activity-service-messenger';

describe('getAccountActivityServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const accountActivityServiceMessenger = getAccountActivityServiceMessenger(messenger);

    expect(accountActivityServiceMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});