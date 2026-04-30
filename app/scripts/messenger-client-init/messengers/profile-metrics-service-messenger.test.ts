import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getProfileMetricsServiceMessenger } from './profile-metrics-service-messenger';

describe('getProfileMetricsServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const profileMetricsServiceMessenger =
      getProfileMetricsServiceMessenger(messenger);

    expect(profileMetricsServiceMessenger).toBeInstanceOf(Messenger);
  });
});
