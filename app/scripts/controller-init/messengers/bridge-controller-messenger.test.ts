import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getBridgeControllerInitMessenger,
  getBridgeControllerMessenger,
} from './bridge-controller-messenger';

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
