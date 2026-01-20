import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getAccountTreeControllerInitMessenger,
  getAccountTreeControllerMessenger,
} from './account-tree-controller-messenger';

describe('getAccountTreeControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const accountTreeControllerMessenger =
      getAccountTreeControllerMessenger(messenger);

    expect(accountTreeControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getAccountTreeControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const accountTreeControllerInitMessenger =
      getAccountTreeControllerInitMessenger(messenger);

    expect(accountTreeControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
