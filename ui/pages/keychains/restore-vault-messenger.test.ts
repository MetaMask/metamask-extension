import { RESTORE_VAULT_ROUTE_CAPABILITIES } from './restore-vault-messenger';

describe('RESTORE_VAULT_ROUTE_CAPABILITIES', () => {
  it('allows only passkey enrollment actions', () => {
    expect(RESTORE_VAULT_ROUTE_CAPABILITIES).toStrictEqual({
      actions: [
        'PasskeyController:generateRegistrationOptions',
        'PasskeyController:generatePostRegistrationAuthenticationOptions',
        'PasskeyController:protectVaultKeyWithPasskey',
      ],
      events: [],
    });
  });
});
