import { PRIVATE_KEY_LIST_ROUTE_CAPABILITIES } from './messenger';

describe('PRIVATE_KEY_LIST_ROUTE_CAPABILITIES', () => {
  it('allows only passkey authentication and private-key export', () => {
    expect(PRIVATE_KEY_LIST_ROUTE_CAPABILITIES).toStrictEqual({
      actions: [
        'PasskeyController:generateAuthenticationOptions',
        'PasskeyController:exportAccountsWithPasskey',
      ],
      events: [],
    });
  });
});
