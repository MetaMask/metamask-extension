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
 * Builds auth state as `performSignIn` writes it: paired identifiers on the
 * SRP session profile.
 *
 * @param pairedIdentifierIds - Identifiers to attach to the session profile.
 */
function buildAuthState(
  pairedIdentifierIds?: PairedIdentifier[],
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
          ...(pairedIdentifierIds ? { pairedIdentifierIds } : {}),
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
  it('reads paired identifier ids from the srp session profile', () => {
    expect(
      getPairedIdentifierIdsFromAuthState(
        buildAuthState([{ type: 'GOOGLE' }, { type: 'SRP' }]),
      ),
    ).toStrictEqual([{ type: 'GOOGLE' }, { type: 'SRP' }]);
  });

  it('returns undefined when the profile has no paired identifiers', () => {
    expect(
      getPairedIdentifierIdsFromAuthState(buildAuthState()),
    ).toBeUndefined();
  });
});

describe('authenticationStateIncludesLinkedSocialLogin', () => {
  it('detects a social login from srp session paired identifiers', () => {
    expect(
      authenticationStateIncludesLinkedSocialLogin(
        buildAuthState([{ type: 'APPLE' }]),
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

  it('returns false when the controller version predates paired identifiers', () => {
    expect(authenticationStateIncludesLinkedSocialLogin(buildAuthState())).toBe(
      false,
    );
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
