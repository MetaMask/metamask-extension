import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getSentinelApiServiceMessenger } from './sentinel-api-service-messenger';

describe('getSentinelApiServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const sentinelApiServiceMessenger =
      getSentinelApiServiceMessenger(messenger);

    expect(sentinelApiServiceMessenger).toBeInstanceOf(Messenger);
  });
});
