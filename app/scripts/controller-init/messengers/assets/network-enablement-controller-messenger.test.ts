import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getNetworkEnablementControllerMessenger,
  getNetworkEnablementControllerInitMessenger,
} from './network-enablement-controller-messenger';

describe('getNetworkEnablementControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const networkEnablementControllerMessenger =
      getNetworkEnablementControllerMessenger(messenger);
    expect(networkEnablementControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getNetworkEnablementControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const networkEnablementControllerInitMessenger =
      getNetworkEnablementControllerInitMessenger(messenger);
    expect(networkEnablementControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
