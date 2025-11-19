import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getMultichainRouterMessenger } from './multichain-router-messenger';

describe('getMultichainRouterMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const MultichainRouterMessenger = getMultichainRouterMessenger(messenger);

    expect(MultichainRouterMessenger).toBeInstanceOf(Messenger);
  });
});
