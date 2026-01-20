import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getGatorPermissionsControllerMessenger } from './gator-permissions-controller-messenger';

describe('getGatorPermissionsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const gatorPermissionsControllerMessenger =
      getGatorPermissionsControllerMessenger(messenger);

    expect(gatorPermissionsControllerMessenger).toBeInstanceOf(Messenger);
  });
});
