import {
  ControllerMessenger,
  RestrictedMessenger,
} from '@metamask/base-controller';
import {
  getSnapControllerInitMessenger,
  getSnapControllerMessenger,
} from './snap-controller-messenger';

describe('getSnapControllerMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = new ControllerMessenger<never, never>();
    const snapControllerMessenger =
      getSnapControllerMessenger(controllerMessenger);

    expect(snapControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getSnapControllerInitMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = new ControllerMessenger<never, never>();
    const snapControllerMessenger =
      getSnapControllerInitMessenger(controllerMessenger);

    expect(snapControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
