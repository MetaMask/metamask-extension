import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getBridgeControllerInitMessenger,
  getBridgeControllerMessenger,
} from './bridge-controller-messenger';

describe('getBridgeControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const BridgeControllerMessenger = getBridgeControllerMessenger(messenger);

    expect(BridgeControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getBridgeControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const BridgeControllerInitMessenger =
      getBridgeControllerInitMessenger(messenger);

    expect(BridgeControllerInitMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
