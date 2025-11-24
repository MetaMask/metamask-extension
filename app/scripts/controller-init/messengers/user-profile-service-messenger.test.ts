import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getUserProfileServiceMessenger } from './user-profile-service-messenger';

describe('getUserProfileServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const userProfileServiceMessenger =
      getUserProfileServiceMessenger(messenger);

    expect(userProfileServiceMessenger).toBeInstanceOf(Messenger);
  });
});
