import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getGatorPermissionsControllerInitMessenger } from './gator-permissions-controller-messenger';

describe('getGatorPermissionsControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const delegationControllerMessenger =
      getGatorPermissionsControllerInitMessenger(messenger);

    expect(delegationControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
