import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getBrazeServiceMessenger } from './braze-service-messenger';

describe('getBrazeServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const brazeServiceMessenger = getBrazeServiceMessenger(messenger);

    expect(brazeServiceMessenger).toBeInstanceOf(Messenger);
  });
});
