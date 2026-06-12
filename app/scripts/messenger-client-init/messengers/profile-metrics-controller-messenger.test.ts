import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getProfileMetricsControllerMessenger } from './profile-metrics-controller-messenger';

describe('getProfileMetricsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const profileMetricsControllerMessenger =
      getProfileMetricsControllerMessenger(messenger);

    expect(profileMetricsControllerMessenger).toBeInstanceOf(Messenger);
  });
});
