import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '..';
import {
  getMultichainAccountServiceInitMessenger,
  getMultichainAccountServiceMessenger,
} from './multichain-account-service-messenger';

describe('getMultichainAccountServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const multichainAccountServiceMessenger =
      getMultichainAccountServiceMessenger(messenger);

    expect(multichainAccountServiceMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getMultichainAccountServiceInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const multichainAccountServiceInitMessenger =
      getMultichainAccountServiceInitMessenger(messenger);

    expect(multichainAccountServiceInitMessenger).toBeInstanceOf(Messenger);
  });
});
