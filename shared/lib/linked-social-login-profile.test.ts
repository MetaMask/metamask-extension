import type { ProfileAlias } from '@metamask/profile-sync-controller/auth';
import {
  authenticationStateIncludesLinkedSocialLogin,
  pairedIdentifiersIncludeSocialLogin,
  profileAliasesIncludeSocialLogin,
  shouldRepairBasicFunctionalitySocialMigrationNotice,
} from './linked-social-login-profile';

describe('profileAliasesIncludeSocialLogin', () => {
  it('returns true when an alias includes a social identifier type', () => {
    const profileAliases: ProfileAlias[] = [
      {
        aliasProfileId: 'alias-1',
        canonicalProfileId: 'canonical-1',
        identifierIds: [{ id: 'google-id', type: 'GOOGLE' }],
      },
    ];

    expect(profileAliasesIncludeSocialLogin(profileAliases)).toBe(true);
  });

  it('returns false when aliases only include SRP identifiers', () => {
    const profileAliases: ProfileAlias[] = [
      {
        aliasProfileId: 'alias-1',
        canonicalProfileId: 'canonical-1',
        identifierIds: [{ id: 'srp-id', type: 'SRP' }],
      },
    ];

    expect(profileAliasesIncludeSocialLogin(profileAliases)).toBe(false);
  });
});

describe('pairedIdentifiersIncludeSocialLogin', () => {
  it('returns true when paired identifiers include a social type', () => {
    expect(
      pairedIdentifiersIncludeSocialLogin([{ type: 'APPLE' }, { type: 'SRP' }]),
    ).toBe(true);
  });

  it('returns false when paired identifiers are empty', () => {
    expect(pairedIdentifiersIncludeSocialLogin([])).toBe(false);
  });
});

describe('authenticationStateIncludesLinkedSocialLogin', () => {
  it('reads linked social identifier types from Core state', () => {
    expect(
      authenticationStateIncludesLinkedSocialLogin({
        linkedSocialIdentifierTypes: ['SRP', 'TELEGRAM'],
      }),
    ).toBe(true);
  });

  it('reads paired identifier ids from Core state', () => {
    expect(
      authenticationStateIncludesLinkedSocialLogin({
        pairedIdentifierIds: [{ type: 'GOOGLE' }],
      }),
    ).toBe(true);
  });
});

describe('shouldRepairBasicFunctionalitySocialMigrationNotice', () => {
  it('returns true for consolidated social wallets missing a scheduled notice', () => {
    expect(
      shouldRepairBasicFunctionalitySocialMigrationNotice({
        hasConsolidationMarker: true,
        useExternalServices: true,
        isSocialLogin: true,
        migrationNotification: null,
        migrationNotificationDismissed: false,
      }),
    ).toBe(true);
  });

  it('returns false when the notice was dismissed', () => {
    expect(
      shouldRepairBasicFunctionalitySocialMigrationNotice({
        hasConsolidationMarker: true,
        useExternalServices: true,
        isSocialLogin: true,
        migrationNotification: null,
        migrationNotificationDismissed: true,
      }),
    ).toBe(false);
  });
});
