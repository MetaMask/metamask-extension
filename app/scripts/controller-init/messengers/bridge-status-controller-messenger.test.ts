import { Messenger } from '@metamask/messenger';
import { getBridgeStatusControllerMessenger } from './bridge-status-controller-messenger';
import { getRootMessenger } from '.';

describe('getBridgeStatusControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const BridgeStatusControllerMessenger =
      getBridgeStatusControllerMessenger(messenger);

    expect(BridgeStatusControllerMessenger).toBeInstanceOf(Messenger);
  });
});
