import { REVEAL_RECOVERY_PHRASE_ROUTE_CAPABILITIES } from './messenger';

describe('REVEAL_RECOVERY_PHRASE_ROUTE_CAPABILITIES', () => {
  it('allows only passkey authentication and encoded seed export', () => {
    expect(REVEAL_RECOVERY_PHRASE_ROUTE_CAPABILITIES).toStrictEqual({
      actions: [
        'PasskeyController:generateAuthenticationOptions',
        'LegacyBackgroundApiService:exportSeedPhraseWithPasskey',
      ],
      events: [],
    });
  });
});
