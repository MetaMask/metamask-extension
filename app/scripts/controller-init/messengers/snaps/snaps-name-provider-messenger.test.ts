import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getSnapsNameProviderMessenger } from './snaps-name-provider-messenger';

describe('getSnapsNameProviderMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const snapsNameProviderMessenger = getSnapsNameProviderMessenger(messenger);

    expect(snapsNameProviderMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
