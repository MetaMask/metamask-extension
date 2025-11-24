import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getUserProfileControllerMessenger } from './user-profile-controller-messenger';

describe('getUserProfileControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const userProfileControllerMessenger =
      getUserProfileControllerMessenger(messenger);

    expect(userProfileControllerMessenger).toBeInstanceOf(Messenger);
  });
});
