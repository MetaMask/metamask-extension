import type { ProfileAlias } from '@metamask/profile-sync-controller/auth';
import {
  authenticationStateIncludesLinkedSocialLogin,
  getPairedIdentifierIdsFromAuthState,
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

describe('getPairedIdentifierIdsFromAuthState', () => {
  it('reads paired identifier ids from the primary srp session profile', () => {
    expect(
      getPairedIdentifierIdsFromAuthState({
        isSignedIn: true,
        srpSessionData: {
          'entropy-1': {
            profile: {
              identifierId: 'id-1',
              metaMetricsId: 'mm-1',
              profileId: 'profile-1',
              canonicalProfileId: 'profile-1',
              pairedIdentifierIds: [{ type: 'GOOGLE' }, { type: 'SRP' }],
            },
            token: {
              accessToken: 'token',
              expiresIn: 3600,
              obtainedAt: 1,
            },
          },
        },
      }),
    ).toStrictEqual([{ type: 'GOOGLE' }, { type: 'SRP' }]);
  });
});

describe('authenticationStateIncludesLinkedSocialLogin', () => {
  it('reads paired identifier ids from srpSessionData profile', () => {
    expect(
      authenticationStateIncludesLinkedSocialLogin({
        isSignedIn: true,
        srpSessionData: {
          'entropy-1': {
            profile: {
              identifierId: 'id-1',
              metaMetricsId: 'mm-1',
              profileId: 'profile-1',
              canonicalProfileId: 'profile-1',
              pairedIdentifierIds: [{ type: 'GOOGLE' }],
            },
            token: {
              accessToken: 'token',
              expiresIn: 3600,
              obtainedAt: 1,
            },
          },
        },
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
