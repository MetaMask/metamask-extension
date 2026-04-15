import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getBackgroundApiServiceMessenger } from './background-api-service-messenger';

describe('getBackgroundApiServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const backgroundApiServiceMessenger =
      getBackgroundApiServiceMessenger(messenger);

    expect(backgroundApiServiceMessenger).toBeInstanceOf(Messenger);
  });
});
