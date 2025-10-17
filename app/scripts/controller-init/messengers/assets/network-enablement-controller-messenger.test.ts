import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getNetworkEnablementControllerMessenger,
  getNetworkEnablementControllerInitMessenger,
} from './network-enablement-controller-messenger';

describe('getNetworkEnablementControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const networkEnablementControllerMessenger =
      getNetworkEnablementControllerMessenger(messenger);
    expect(networkEnablementControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});

describe('getNetworkEnablementControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const networkEnablementControllerInitMessenger =
      getNetworkEnablementControllerInitMessenger(messenger);
    expect(networkEnablementControllerInitMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
