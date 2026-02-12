import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getSnapsRegistryMessenger } from './snaps-registry-messenger';

describe('getSnapsRegistryMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const snapsRegistryMessenger = getSnapsRegistryMessenger(messenger);

    expect(snapsRegistryMessenger).toBeInstanceOf(Messenger);
  });
});
