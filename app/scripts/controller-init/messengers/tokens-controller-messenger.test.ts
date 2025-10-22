import { Messenger } from '@metamask/messenger';
import {
  getTokensControllerInitMessenger,
  getTokensControllerMessenger,
} from './tokens-controller-messenger';
import { getRootMessenger } from '.';

describe('getTokensControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const controllerMessenger = getTokensControllerMessenger(messenger);

    expect(controllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getTokensControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const initMessenger = getTokensControllerInitMessenger(messenger);

    expect(initMessenger).toBeInstanceOf(Messenger);
  });
});
