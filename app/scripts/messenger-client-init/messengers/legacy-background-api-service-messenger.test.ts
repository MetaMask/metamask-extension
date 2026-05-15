import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getLegacyBackgroundApiServiceMessenger } from './legacy-background-api-service-messenger';

describe('getLegacyBackgroundApiServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const legacyBackgroundApiServiceMessenger =
      getLegacyBackgroundApiServiceMessenger(messenger);

    expect(legacyBackgroundApiServiceMessenger).toBeInstanceOf(Messenger);
  });
});
