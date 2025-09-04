import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getGatorPermissionsControllerMessenger } from './gator-permissions-controller-messenger';

describe('getGatorPermissionsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const delegationControllerMessenger =
      getGatorPermissionsControllerMessenger(messenger);

    expect(delegationControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
