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
 * If more than this many BFT child prefs are enabled, consolidation lands
 * Basic Functionality on (majority of {@link BFT_CHILD_PREFERENCES}).
 */
export const BFT_ENABLED_CHILDREN_LANDING_THRESHOLD = 9;

export type BasicFunctionalityMigrationNotification = 'modal' | 'toast' | null;

export type BasicFunctionalityPreferenceState = {
  useExternalServices: boolean;
} & Record<(typeof BFT_CHILD_PREFERENCES)[number], boolean>;

export type BasicFunctionalityConsolidationPlan = {
  landingState: boolean;
  notification: BasicFunctionalityMigrationNotification;
};

/**
 * Whether the user should be treated as a social-login wallet for BFT
 * consolidation and notice presentation.
 *
 * @param params - Social-login signals from onboarding state.
 * @param params.firstTimeFlowType - Onboarding first-time flow type.
 * @param params.authConnection - Seedless social login provider, if any.
 */
export function isBasicFunctionalitySocialLoginUser({
  firstTimeFlowType,
  authConnection,
}: {
  firstTimeFlowType?: string;
  authConnection?: string;
}): boolean {
  return (
    firstTimeFlowType === FirstTimeFlowType.socialCreate ||
    firstTimeFlowType === FirstTimeFlowType.socialImport ||
    Boolean(authConnection)
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

  return { landingState, notification };
}
