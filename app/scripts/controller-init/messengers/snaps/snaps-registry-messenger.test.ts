import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getSnapsRegistryMessenger } from './snaps-registry-messenger';

describe('getSnapsRegistryMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const messenger = new Messenger<never, never>();
    const snapsRegistryMessenger = getSnapsRegistryMessenger(messenger);

    expect(snapsRegistryMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
