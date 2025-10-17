import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getAccountOrderControllerMessenger } from './account-order-controller-messenger';

describe('getAccountOrderControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const accountOrderControllerMessenger =
      getAccountOrderControllerMessenger(messenger);

    expect(accountOrderControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
