import type { AuthenticationControllerState } from '@metamask/profile-sync-controller/auth';
import {
  authenticationStateIncludesLinkedSocialLogin,
  getPairedIdentifierIdsFromAuthState,
  pairedIdentifiersIncludeSocialLogin,
  profileAliasesIncludeSocialLogin,
  shouldRepairBasicFunctionalitySocialMigrationNotice,
  type PairedIdentifier,
} from './linked-social-login-profile';

/**
 * Builds auth state with paired identifiers on the primary SRP session
 * profile. Core PR #10394 adds `pairedIdentifierIds` to `UserProfile`; cast
 * until that lands in the installed `@metamask/profile-sync-controller`.
 *
 * @param pairedIdentifierIds - Paired identifiers to attach to the profile.
 */
function buildAuthState(
  pairedIdentifierIds: PairedIdentifier[],
): AuthenticationControllerState {
  return {
    isSignedIn: true,
    srpSessionData: {
      'entropy-1': {
        profile: {
          identifierId: 'id-1',
          metaMetricsId: 'mm-1',
          profileId: 'profile-1',
          canonicalProfileId: 'profile-1',
          pairedIdentifierIds,
        },
        token: {
          accessToken: 'token',
          expiresIn: 3600,
          obtainedAt: 1,
        },
      },
    },
  } as AuthenticationControllerState;
}

describe('profileAliasesIncludeSocialLogin', () => {
  it('returns true when an alias includes a social identifier type', () => {
    expect(
      profileAliasesIncludeSocialLogin([
        { identifierIds: [{ type: 'GOOGLE' }] },
      ]),
    ).toBe(true);
  });

  it('returns false when aliases only include SRP identifiers', () => {
    expect(
      profileAliasesIncludeSocialLogin([{ identifierIds: [{ type: 'SRP' }] }]),
    ).toBe(false);
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
      getPairedIdentifierIdsFromAuthState(
        buildAuthState([{ type: 'GOOGLE' }, { type: 'SRP' }]),
      ),
    ).toStrictEqual([{ type: 'GOOGLE' }, { type: 'SRP' }]);
  });
});

describe('authenticationStateIncludesLinkedSocialLogin', () => {
  it('reads paired identifier ids from srpSessionData profile', () => {
    expect(
      authenticationStateIncludesLinkedSocialLogin(
        buildAuthState([{ type: 'GOOGLE' }]),
      ),
    ).toBe(true);
  });

  it('returns false when paired identifiers are only SRP', () => {
    expect(
      authenticationStateIncludesLinkedSocialLogin(
        buildAuthState([{ type: 'SRP' }]),
      ),
    ).toBe(false);
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
