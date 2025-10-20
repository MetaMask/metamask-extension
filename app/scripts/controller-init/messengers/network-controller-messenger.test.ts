import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getNetworkControllerInitMessenger,
  getNetworkControllerMessenger,
} from './network-controller-messenger';

describe('getNetworkControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const NetworkControllerMessenger = getNetworkControllerMessenger(messenger);

    expect(NetworkControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getNetworkControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const NetworkControllerInitMessenger =
      getNetworkControllerInitMessenger(messenger);

    expect(NetworkControllerInitMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
