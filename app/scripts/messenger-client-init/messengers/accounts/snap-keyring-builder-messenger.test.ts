import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getSnapKeyringBuilderInitMessenger,
  getSnapKeyringBuilderMessenger,
} from './snap-keyring-builder-messenger';

describe('getSnapKeyringMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const SnapKeyringMessenger = getSnapKeyringBuilderMessenger(messenger);

    expect(SnapKeyringMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getSnapKeyringInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const SnapKeyringInitMessenger =
      getSnapKeyringBuilderInitMessenger(messenger);

    expect(SnapKeyringInitMessenger).toBeInstanceOf(Messenger);
  });
});
