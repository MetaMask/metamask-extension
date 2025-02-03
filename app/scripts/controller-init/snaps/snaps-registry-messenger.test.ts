import {
  ControllerMessenger,
  RestrictedMessenger,
} from '@metamask/base-controller';
import { getSnapsRegistryMessenger } from './snaps-registry-messenger';

describe('getSnapsRegistryMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = new ControllerMessenger<never, never>();
    const snapsRegistryMessenger =
      getSnapsRegistryMessenger(controllerMessenger);

    expect(snapsRegistryMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
