import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getSnapRegistryControllerMessenger } from './snap-registry-controller-messenger';

describe('getSnapRegistryControllerMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const snapsRegistryMessenger =
      getSnapRegistryControllerMessenger(messenger);

    expect(snapsRegistryMessenger).toBeInstanceOf(Messenger);
  });
});
