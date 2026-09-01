import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getSnapInterfaceControllerMessenger } from './snap-interface-controller-messenger';

describe('getSnapInterfaceControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger();
    const snapInterfaceControllerMessenger =
      getSnapInterfaceControllerMessenger(messenger);

    expect(snapInterfaceControllerMessenger).toBeInstanceOf(Messenger);
  });
});
