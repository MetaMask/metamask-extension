import { Messenger } from '@metamask/messenger';

import { getRootMessenger } from '../../../lib/messenger';
import { getOAuthServiceMessenger } from './oauth-service-messenger';

describe('getOAuthServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const oauthServiceMessenger = getOAuthServiceMessenger(messenger);

    expect(oauthServiceMessenger).toBeInstanceOf(Messenger);
  });
});
