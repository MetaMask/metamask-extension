import { FirstTimeFlowType } from '../constants/onboarding';

export const BFT_CHILD_PREFERENCES = [
  'useCurrencyRateCheck',
  'securityAlertsEnabled',
  'usePhishDetect',
  'useMultiAccountBalanceChecker',
  'useSafeChainsListValidation',
  'useTokenDetection',
  'useTransactionSimulations',
  'use4ByteResolution',
  'openSeaEnabled',
  'useNftDetection',
  'useExternalNameSources',
  'useAddressBarEnsResolution',
] as const;

/**
 * The subset of {@link BFT_CHILD_PREFERENCES} that
 * `PreferencesController.toggleExternalServices` owns. When enabling, callers
 * can pass the current values so they are applied in the same write instead of
 * being overwritten and later restored.
 */
export const EXTERNAL_SERVICES_OWNED_PREFERENCES = [
  'useTokenDetection',
  'useCurrencyRateCheck',
  'usePhishDetect',
  'useAddressBarEnsResolution',
  'openSeaEnabled',
  'useNftDetection',
  'useSafeChainsListValidation',
] as const satisfies readonly (typeof BFT_CHILD_PREFERENCES)[number][];

export type ExternalServicesOwnedPreference =
  (typeof EXTERNAL_SERVICES_OWNED_PREFERENCES)[number];

/**
 * If more than this many BFT child prefs are enabled, consolidation lands
 * Basic Functionality on (majority of {@link BFT_CHILD_PREFERENCES}).
 */
export const BFT_ENABLED_CHILDREN_LANDING_THRESHOLD = 9;

export type BasicFunctionalityMigrationNotification = 'modal' | 'toast' | null;

export type BasicFunctionalityPreferenceState = {
  useExternalServices: boolean;
} & Record<(typeof BFT_CHILD_PREFERENCES)[number], boolean>;

export const LINKED_SOCIAL_IDENTIFIER_TYPES = [
  'GOOGLE',
  'APPLE',
  'TELEGRAM',
] as const;

export type LinkedSocialIdentifierType =
  (typeof LINKED_SOCIAL_IDENTIFIER_TYPES)[number];

export type BasicFunctionalityConsolidationPlan = {
  landingState: boolean;
  notification: BasicFunctionalityMigrationNotification;
  /**
   * True when Basic Functionality and all child prefs already match (all-on or
   * all-off). Aligned wallets are not on `Basic Functionality Migrated`.
   */
  isConsistent: boolean;
};

/**
 * Whether the user should be treated as a social-login wallet for BFT
 * consolidation and notice presentation.
 *
 * @param params - Social-login signals from onboarding state.
 * @param params.firstTimeFlowType - Onboarding first-time flow type.
 * @param params.authConnection - Seedless social login provider, if any.
 * @param params.hasLinkedSocialLoginProfile - Persisted linked-social marker.
 */
export function isBasicFunctionalitySocialLoginUser({
  firstTimeFlowType,
  authConnection,
  hasLinkedSocialLoginProfile = false,
}: {
  firstTimeFlowType?: string;
  authConnection?: string;
  hasLinkedSocialLoginProfile?: boolean;
}): boolean {
  return (
    hasLinkedSocialLoginProfile ||
    firstTimeFlowType === FirstTimeFlowType.socialCreate ||
    firstTimeFlowType === FirstTimeFlowType.socialImport ||
    Boolean(authConnection)
  );
}

/**
 * Whether `profile_aliases` from SRP login include a linked social identifier.
 *
 * @param profileAliases - Alias entries returned by auth login or pairing.
 */
export function profileAliasesIncludeSocialIdentifier(
  profileAliases: {
    identifierIds: { type: string }[];
  }[],
): boolean {
  return profileAliases.some((alias) =>
    alias.identifierIds.some((identifier) =>
      LINKED_SOCIAL_IDENTIFIER_TYPES.includes(
        identifier.type as LinkedSocialIdentifierType,
      ),
    ),
  );
}

/**
 * Computes the one-time Basic Functionality consolidation landing state and
 * notice. Call only when the remote FF is on and the user is not yet
 * consolidated.
 *
 * @param preferences - Current Basic Functionality preference values.
 * @param isSocialLogin - Whether this is a social-login user.
 */
export function getBasicFunctionalityConsolidationPlan(
  preferences: BasicFunctionalityPreferenceState,
  isSocialLogin: boolean,
): BasicFunctionalityConsolidationPlan {
  const basicFunctionalityEnabled = preferences.useExternalServices === true;
  const areAllChildrenEnabled = BFT_CHILD_PREFERENCES.every(
    (preference) => preferences[preference] === true,
  );
  const areAllChildrenDisabled = BFT_CHILD_PREFERENCES.every(
    (preference) => preferences[preference] === false,
  );
  const enabledChildren = BFT_CHILD_PREFERENCES.filter(
    (preference) => preferences[preference] === true,
  ).length;

  const landingState =
    basicFunctionalityEnabled ||
    isSocialLogin ||
    enabledChildren > BFT_ENABLED_CHILDREN_LANDING_THRESHOLD;

  const isConsistent =
    (basicFunctionalityEnabled && areAllChildrenEnabled) ||
    (!basicFunctionalityEnabled && areAllChildrenDisabled);

  let notification: BasicFunctionalityMigrationNotification = null;
  if (isSocialLogin) {
    notification = 'modal';
  } else if (!isConsistent) {
    notification = 'toast';
  }

  return { landingState, notification, isConsistent };
}

/**
 * Whether to start the one-time consolidation write for an unmarked wallet.
 *
 * The remote flag is the kill switch for users who can still fetch LaunchDarkly
 * (Basic Functionality on). BF-off users cannot fetch remote flags, so the
 * build flag hardcodes their consolidation and notice path in this release.
 *
 * @param params - Consolidation start inputs.
 * @param params.isRemoteFlagEnabled - Cached/live `extensionBasicFunctionalityToggle`.
 * @param params.isBuildFlagEnabled - Compile-time `BFT_CONSOLIDATION_ENABLED`.
 * @param params.useExternalServices - Current Basic Functionality state.
 * @param params.hasConsolidationMarker - Whether the wallet is already marked.
 */
/**
 * Whether a consolidated social wallet still needs the migration modal
 * scheduled (for example after SRP import cleared local OAuth state).
 *
 * @param params - Repair inputs from preferences and social classification.
 * @param params.hasConsolidationMarker
 * @param params.useExternalServices
 * @param params.isSocialLogin
 * @param params.migrationNotification
 * @param params.migrationNotificationDismissed
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
  migrationNotification: BasicFunctionalityMigrationNotification;
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

export function shouldStartBasicFunctionalityConsolidation({
  isRemoteFlagEnabled,
  isBuildFlagEnabled,
  useExternalServices,
  hasConsolidationMarker,
}: {
  isRemoteFlagEnabled: boolean;
  isBuildFlagEnabled: boolean;
  useExternalServices: boolean;
  hasConsolidationMarker: boolean;
}): boolean {
  if (hasConsolidationMarker) {
    return false;
  }

  if (isRemoteFlagEnabled) {
    return true;
  }

  return isBuildFlagEnabled && useExternalServices === false;
}
