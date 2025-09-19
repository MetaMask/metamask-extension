import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getSnapKeyringInitMessenger,
  getSnapKeyringMessenger,
} from './snap-keyring-messenger';

describe('getSnapKeyringMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const SnapKeyringMessenger = getSnapKeyringMessenger(messenger);

    expect(SnapKeyringMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getSnapKeyringInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const SnapKeyringInitMessenger =
      getSnapKeyringInitMessenger(messenger);

    expect(SnapKeyringInitMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
