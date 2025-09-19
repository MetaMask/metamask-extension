import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getSnapKeyringBuilderInitMessenger,
  getSnapKeyringBuilderMessenger,
} from './snap-keyring-builder-messenger';

describe('getSnapKeyringMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const SnapKeyringMessenger = getSnapKeyringBuilderMessenger(messenger);

    expect(SnapKeyringMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getSnapKeyringInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const SnapKeyringInitMessenger =
      getSnapKeyringBuilderInitMessenger(messenger);

    expect(SnapKeyringInitMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
