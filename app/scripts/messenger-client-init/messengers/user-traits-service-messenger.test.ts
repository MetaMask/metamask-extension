import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getUserTraitsServiceMessenger } from './user-traits-service-messenger';

describe('getUserTraitsServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger();
    const userTraitsServiceMessenger = getUserTraitsServiceMessenger(messenger);

    expect(userTraitsServiceMessenger).toBeInstanceOf(Messenger);
  });
});
