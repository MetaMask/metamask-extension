import { Messenger } from '@metamask/messenger';
import {
  getRemoteFeatureFlagControllerMessenger,
  getRemoteFeatureFlagControllerInitMessenger,
} from './remote-feature-flag-controller-messenger';
import { getRootMessenger } from '.';

describe('getRemoteFeatureFlagControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const remoteFeatureFlagControllerMessenger =
      getRemoteFeatureFlagControllerMessenger(messenger);

    expect(remoteFeatureFlagControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getRemoteFeatureFlagInitControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const remoteFeatureFlagControllerInitMessenger =
      getRemoteFeatureFlagControllerInitMessenger(messenger);

    expect(remoteFeatureFlagControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
