import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getDelegationControllerMessenger } from './delegation-controller-messenger';

describe('getDelegationControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const delegationControllerMessenger =
      getDelegationControllerMessenger(messenger);

    expect(delegationControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
