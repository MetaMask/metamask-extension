import type {
  AuthenticationControllerState,
  ProfileAlias,
} from '@metamask/profile-sync-controller/auth';

export const SOCIAL_LOGIN_IDENTIFIER_TYPES = new Set([
  'GOOGLE',
  'APPLE',
  'TELEGRAM',
]);

/**
 * Auth-api identifier types that indicate a profile is linked to social login.
 * Populated by Core from `profile.paired_identifier_ids` after SRP login.
 */
export type SocialLoginIdentifierType = 'GOOGLE' | 'APPLE' | 'TELEGRAM';

export type PairedIdentifier = {
  type: string;
};

/**
 * Returns whether any profile alias includes a social identifier type.
 *
 * @param profileAliases - Aliases returned by profile pair or sign-in events.
 */
export function profileAliasesIncludeSocialLogin(
  profileAliases: ProfileAlias[] | undefined,
): boolean {
  if (!profileAliases?.length) {
    return false;
  }

  return profileAliases.some((alias) =>
    alias.identifierIds.some((identifier: { type: string }) =>
      SOCIAL_LOGIN_IDENTIFIER_TYPES.has(identifier.type),
    ),
  );
}

/**
 * Returns whether paired identifier metadata includes a social login type.
 *
 * @param pairedIdentifierIds - Values from Core's `pairedIdentifierIds` state.
 */
export function pairedIdentifiersIncludeSocialLogin(
  pairedIdentifierIds: readonly PairedIdentifier[] | undefined,
): boolean {
  if (!pairedIdentifierIds?.length) {
    return false;
  }

  return pairedIdentifierIds.some((identifier) =>
    SOCIAL_LOGIN_IDENTIFIER_TYPES.has(identifier.type),
  );
}

/**
 * Reads `pairedIdentifierIds` from the primary SRP session profile in
 * `srpSessionData`, as exposed by Core after SRP login / pairing.
 *
 * @param authState - AuthenticationController state after `performSignIn`.
 */
export function getPairedIdentifierIdsFromAuthState(
  authState: AuthenticationControllerState,
): readonly PairedIdentifier[] | undefined {
  const { srpSessionData } = authState;
  if (!srpSessionData) {
    return undefined;
  }

  for (const session of Object.values(srpSessionData)) {
    // Core PR #10394 adds this field to `UserProfile`; cast until the
    // `@metamask/profile-sync-controller` bump lands in Extension.
    const { pairedIdentifierIds } = session.profile as {
      pairedIdentifierIds?: readonly PairedIdentifier[];
    };
    if (pairedIdentifierIds?.length) {
      return pairedIdentifierIds;
    }
  }

  return undefined;
}

/**
 * Returns whether linked social identifiers are present on AuthenticationController
 * state once Core exposes them after `performSignIn`.
 *
 * @param authState - AuthenticationController state, including optional Core fields.
 */
export function authenticationStateIncludesLinkedSocialLogin(
  authState: AuthenticationControllerState,
): boolean {
  return pairedIdentifiersIncludeSocialLogin(
    getPairedIdentifierIdsFromAuthState(authState),
  );
}

/**
 * Whether a consolidated social-linked wallet still needs the one-time migration
 * modal scheduled. A pending SRP toast is upgraded to the social modal; an
 * existing social modal or a dismissed notice is left alone.
 * @param options0
 * @param options0.hasConsolidationMarker
 * @param options0.useExternalServices
 * @param options0.isSocialLogin
 * @param options0.migrationNotification
 * @param options0.migrationNotificationDismissed
 */
export function shouldRepairBasicFunctionalitySocialMigrationNotice({
  hasConsolidationMarker,
  useExternalServices,
  isSocialLogin,
  migrationNotification,
  migrationNotificationDismissed,
}: {
  hasConsolidationMarker: boolean;
  useExternalServices: boolean;
  isSocialLogin: boolean;
  migrationNotification: 'modal' | 'toast' | null;
  migrationNotificationDismissed: boolean;
}): boolean {
  return (
    hasConsolidationMarker &&
    useExternalServices &&
    isSocialLogin &&
    !migrationNotificationDismissed &&
    migrationNotification !== 'modal'
  );
}
