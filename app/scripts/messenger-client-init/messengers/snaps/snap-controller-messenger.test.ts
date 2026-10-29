import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getSnapControllerInitMessenger,
  getSnapControllerMessenger,
} from './snap-controller-messenger';

describe('getSnapControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const controllerMessenger = getRootMessenger<never, never>();
    const snapControllerMessenger =
      getSnapControllerMessenger(controllerMessenger);

    expect(snapControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getSnapControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const controllerMessenger = getRootMessenger<never, never>();
    const snapControllerMessenger =
      getSnapControllerInitMessenger(controllerMessenger);

    expect(snapControllerMessenger).toBeInstanceOf(Messenger);
  });
});
