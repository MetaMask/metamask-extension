import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getTokenListControllerInitMessenger,
  getTokenListControllerMessenger,
} from './token-list-controller-messenger';

describe('getTokenListControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const controllerMessenger = getTokenListControllerMessenger(messenger);

    expect(controllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getTokenListControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const initMessenger = getTokenListControllerInitMessenger(messenger);

    expect(initMessenger).toBeInstanceOf(Messenger);
  });
});
