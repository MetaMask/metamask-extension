import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getBridgeStatusControllerMessenger } from './bridge-status-controller-messenger';

describe('getBridgeStatusControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const BridgeStatusControllerMessenger =
      getBridgeStatusControllerMessenger(messenger);

    expect(BridgeStatusControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
