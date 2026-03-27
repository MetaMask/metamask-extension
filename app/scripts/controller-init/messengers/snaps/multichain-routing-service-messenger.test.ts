import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getMultichainRoutingServiceMessenger } from './multichain-routing-service-messenger';

describe('getMultichainRouterMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const MultichainRouterMessenger =
      getMultichainRoutingServiceMessenger(messenger);

    expect(MultichainRouterMessenger).toBeInstanceOf(Messenger);
  });
});
