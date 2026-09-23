import type { ProfileAlias } from '@metamask/profile-sync-controller/auth';

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
 * Extension-side view of {@link AuthenticationControllerState} once Core exposes
 * linked social identifiers from the SRP login response.
 */
export type AuthenticationControllerStateWithLinkedSocial = {
  linkedSocialIdentifierTypes?: readonly string[];
  pairedIdentifierIds?: readonly PairedIdentifier[];
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
    alias.identifierIds.some((identifier) =>
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
 * Returns whether linked social identifiers are present on AuthenticationController
 * state once Core exposes them after `performSignIn`.
 *
 * @param authState - AuthenticationController state, including optional Core fields.
 */
export function authenticationStateIncludesLinkedSocialLogin(
  authState: AuthenticationControllerStateWithLinkedSocial,
): boolean {
  if (
    authState.linkedSocialIdentifierTypes?.some((identifierType) =>
      SOCIAL_LOGIN_IDENTIFIER_TYPES.has(identifierType),
    )
  ) {
    return true;
  }

  return pairedIdentifiersIncludeSocialLogin(authState.pairedIdentifierIds);
}

/**
 * Whether a consolidated social-linked wallet still needs the one-time migration
 * modal scheduled.
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
    migrationNotification === null
  );
}
