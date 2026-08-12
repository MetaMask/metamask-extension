import { REVEAL_SEED_ROUTE_CAPABILITIES } from './reveal-seed-messenger';

describe('REVEAL_SEED_ROUTE_CAPABILITIES', () => {
  it('allows only passkey authentication and encoded seed export', () => {
    expect(REVEAL_SEED_ROUTE_CAPABILITIES).toStrictEqual({
      actions: [
        'PasskeyController:generateAuthenticationOptions',
        'LegacyBackgroundApiService:exportSeedPhraseWithPasskey',
      ],
      events: [],
    });
  });
});
