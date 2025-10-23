import { Messenger } from '@metamask/messenger';
import {
  getBridgeControllerInitMessenger,
  getBridgeControllerMessenger,
} from './bridge-controller-messenger';
import { getRootMessenger } from '.';

describe('getBridgeControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const BridgeControllerMessenger = getBridgeControllerMessenger(messenger);

    expect(BridgeControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getBridgeControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const BridgeControllerInitMessenger =
      getBridgeControllerInitMessenger(messenger);

    expect(BridgeControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
