import {
  ControllerMessenger,
  RestrictedMessenger,
} from '@metamask/base-controller';
import {
  getSnapInterfaceControllerMessenger
} from './snap-interface-controller-messenger';

describe('getSnapInterfaceControllerMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = new ControllerMessenger<never, never>();
    const snapInterfaceControllerMessenger = getSnapInterfaceControllerMessenger(
      controllerMessenger,
    );

    expect(snapInterfaceControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
