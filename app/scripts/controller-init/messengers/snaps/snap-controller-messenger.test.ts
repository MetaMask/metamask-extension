import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getSnapControllerInitMessenger,
  getSnapControllerMessenger,
} from './snap-controller-messenger';

describe('getSnapControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const controllerMessenger = new Messenger<never, never>();
    const snapControllerMessenger =
      getSnapControllerMessenger(controllerMessenger);

    expect(snapControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getSnapControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const controllerMessenger = new Messenger<never, never>();
    const snapControllerMessenger =
      getSnapControllerInitMessenger(controllerMessenger);

    expect(snapControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
