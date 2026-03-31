import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getMultichainRoutingServiceMessenger } from './multichain-routing-service-messenger';

describe('getMultichainRoutingServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const MultichainRoutingServiceMessenger =
      getMultichainRoutingServiceMessenger(messenger);

    expect(MultichainRoutingServiceMessenger).toBeInstanceOf(Messenger);
  });
});
