import { Messenger, RestrictedMessenger } from '@metamask/base-controller';

import { getOAuthServiceMessenger } from './oauth-service-messenger';

describe('getOAuthServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const oauthServiceMessenger = getOAuthServiceMessenger(messenger);

    expect(oauthServiceMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
