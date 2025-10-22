import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '..';
import { getDelegationControllerMessenger } from './delegation-controller-messenger';

describe('getDelegationControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const delegationControllerMessenger =
      getDelegationControllerMessenger(messenger);

    expect(delegationControllerMessenger).toBeInstanceOf(Messenger);
  });
});
