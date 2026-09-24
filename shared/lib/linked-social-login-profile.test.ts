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
 * Builds auth state as `performSignIn` writes it: paired identifiers at the
 * top level and alongside (not inside) each SRP session profile. Cast because
 * Core does not declare these fields on its published state type.
 *
 * @param options - Placement of the paired identifiers.
 * @param options.topLevel - Identifiers on `state.pairedIdentifierIds`.
 * @param options.session - Identifiers on the SRP session entry.
 */
function buildAuthState({
  topLevel,
  session,
}: {
  topLevel?: PairedIdentifier[];
  session?: PairedIdentifier[];
}): AuthenticationControllerState {
  return {
    isSignedIn: true,
    pairedIdentifierIds: topLevel,
    srpSessionData: {
      'entropy-1': {
        pairedIdentifierIds: session,
        profile: {
          identifierId: 'id-1',
          metaMetricsId: 'mm-1',
          profileId: 'profile-1',
          canonicalProfileId: 'profile-1',
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
  it('reads paired identifier ids from the top level of auth state', () => {
    expect(
      getPairedIdentifierIdsFromAuthState(
        buildAuthState({ topLevel: [{ type: 'GOOGLE' }, { type: 'SRP' }] }),
      ),
    ).toStrictEqual([{ type: 'GOOGLE' }, { type: 'SRP' }]);
  });

  it('falls back to the srp session entry when the top level is unset', () => {
    expect(
      getPairedIdentifierIdsFromAuthState(
        buildAuthState({ session: [{ type: 'GOOGLE' }] }),
      ),
    ).toStrictEqual([{ type: 'GOOGLE' }]);
  });

  it('returns undefined when no paired identifiers are present', () => {
    expect(
      getPairedIdentifierIdsFromAuthState(buildAuthState({})),
    ).toBeUndefined();
  });
});

describe('authenticationStateIncludesLinkedSocialLogin', () => {
  it('detects a social login from top-level paired identifiers', () => {
    expect(
      authenticationStateIncludesLinkedSocialLogin(
        buildAuthState({ topLevel: [{ type: 'GOOGLE' }] }),
      ),
    ).toBe(true);
  });

  it('detects a social login from srp session paired identifiers', () => {
    expect(
      authenticationStateIncludesLinkedSocialLogin(
        buildAuthState({ session: [{ type: 'APPLE' }] }),
      ),
    ).toBe(true);
  });

  it('returns false when paired identifiers are only SRP', () => {
    expect(
      authenticationStateIncludesLinkedSocialLogin(
        buildAuthState({ topLevel: [{ type: 'SRP' }] }),
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
