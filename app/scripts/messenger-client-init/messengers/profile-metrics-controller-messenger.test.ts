import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getProfileMetricsControllerInitMessenger,
  getProfileMetricsControllerMessenger,
} from './profile-metrics-controller-messenger';

describe('getProfileMetricsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const profileMetricsControllerMessenger =
      getProfileMetricsControllerMessenger(messenger);

    expect(profileMetricsControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getProfileMetricsControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const profileMetricsControllerInitMessenger =
      getProfileMetricsControllerInitMessenger(messenger);

    expect(profileMetricsControllerInitMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates RemoteFeatureFlagController:getState', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getProfileMetricsControllerInitMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: ['RemoteFeatureFlagController:getState'],
      }),
    );
  });
});
