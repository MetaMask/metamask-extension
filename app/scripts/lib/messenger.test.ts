import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from './messenger';

describe('RootMessenger', () => {
  it('creates a root messenger instance', () => {
    const rootMessenger = getRootMessenger();
    expect(rootMessenger).toBeInstanceOf(Messenger);
  });
});
