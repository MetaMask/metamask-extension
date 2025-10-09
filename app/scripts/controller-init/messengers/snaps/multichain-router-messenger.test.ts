import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getMultichainRouterMessenger } from './multichain-router-messenger';

describe('getMultichainRouterMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const MultichainRouterMessenger = getMultichainRouterMessenger(messenger);

    expect(MultichainRouterMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
