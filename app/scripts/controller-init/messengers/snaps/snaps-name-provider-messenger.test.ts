import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getSnapsNameProviderMessenger } from './snaps-name-provider-messenger';

describe('getSnapsNameProviderMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const snapsNameProviderMessenger = getSnapsNameProviderMessenger(messenger);

    expect(snapsNameProviderMessenger).toBeInstanceOf(Messenger);
  });
});
