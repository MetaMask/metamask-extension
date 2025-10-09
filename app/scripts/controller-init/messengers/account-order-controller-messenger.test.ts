import { Messenger } from '@metamask/messenger';
import { getAccountOrderControllerMessenger } from './account-order-controller-messenger';
import { getRootMessenger } from '.';

describe('getAccountOrderControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const accountOrderControllerMessenger =
      getAccountOrderControllerMessenger(messenger);

    expect(accountOrderControllerMessenger).toBeInstanceOf(Messenger);
  });
});
