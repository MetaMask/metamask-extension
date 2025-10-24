import { Messenger } from '@metamask/messenger';
import {
  getNameControllerInitMessenger,
  getNameControllerMessenger,
} from './name-controller-messenger';
import { getRootMessenger } from '../../lib/messenger';

describe('getNameControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const nameControllerMessenger = getNameControllerMessenger(messenger);

    expect(nameControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getNameControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const nameControllerInitMessenger =
      getNameControllerInitMessenger(messenger);

    expect(nameControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
