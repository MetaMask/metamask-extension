import { useEffect, useRef } from 'react';
import { FirstTimeFlowType } from '../../shared/constants/onboarding';
import { shouldStartBasicFunctionalityConsolidation } from '../../shared/lib/basic-functionality-consolidation';
import { getIsBasicFunctionalityConsolidationEnabledInBuild } from '../../shared/lib/environment';
import { getCompletedOnboarding } from '../ducks/metamask/metamask';
import { getIsUnlocked } from '../ducks/metamask/base-selectors';
import { getIsBasicFunctionalityToggleEnabled } from '../selectors/multichain/feature-flags';
import {
  getIsBasicFunctionalitySocialLoginUser,
  type OnboardingState,
} from '../selectors/onboarding/onboarding';
import {
  selectIsSignedIn,
  selectNeedsSocialPairing,
} from '../selectors/identity/authentication';
import { consolidateBasicFunctionality } from '../store/actions';
import { useAppSelector, useDispatch } from '../store/hooks';

/**
 * Runs one-time Basic Functionality consolidation when the remote flag is on,
 * or when the build flag is on for BF-off wallets that cannot fetch remote
 * flags. Also repairs consolidated social-linked wallets after Core exposes
 * linked social identifiers from auth-api login.
 */
export function useBasicFunctionalityConsolidation(): void {
  const dispatch = useDispatch();
  const isRunning = useRef(false);

  const isBftConsolidationRemoteEnabled = useAppSelector(
    getIsBasicFunctionalityToggleEnabled,
  );
  const hasBftConsolidationMarker = useAppSelector((state) =>
    Boolean(
      state.metamask.preferences?.isBasicFunctionalityConsolidatedEnabled,
    ),
  );
  const hasLinkedSocialLoginProfile = useAppSelector(
    (state) => state.metamask.preferences?.hasLinkedSocialLoginProfile === true,
  );
  const isBasicFunctionalityEnabled = useAppSelector(
    (state) => state.metamask.useExternalServices,
  );
  const isUnlocked = useAppSelector(getIsUnlocked);
  const completedOnboarding = useAppSelector(getCompletedOnboarding);
  const isSocialLoginUser = useAppSelector(
    getIsBasicFunctionalitySocialLoginUser,
  );
  const isSignedIn = useAppSelector(selectIsSignedIn);
  const needsSocialPairing = useAppSelector(selectNeedsSocialPairing);
  const firstTimeFlowType = useAppSelector(
    (state: OnboardingState) => state.metamask.firstTimeFlowType,
  );
  const migrationNotificationDismissed = useAppSelector(
    (state) =>
      state.metamask.preferences
        ?.basicFunctionalityMigrationNotificationDismissed === true,
  );
  const migrationNotification = useAppSelector(
    (state) =>
      state.metamask.preferences?.basicFunctionalityMigrationNotification ??
      null,
  );
  const needsSocialMigrationNoticeRepair =
    hasBftConsolidationMarker &&
    isBasicFunctionalityEnabled &&
    isSocialLoginUser &&
    !migrationNotificationDismissed &&
    migrationNotification === null;

  const shouldRunConsolidation =
    shouldStartBasicFunctionalityConsolidation({
      isRemoteFlagEnabled: isBftConsolidationRemoteEnabled,
      isBuildFlagEnabled: getIsBasicFunctionalityConsolidationEnabledInBuild(),
      useExternalServices: isBasicFunctionalityEnabled,
      hasConsolidationMarker: hasBftConsolidationMarker,
    }) ||
    needsSocialMigrationNoticeRepair ||
    (hasBftConsolidationMarker &&
      !isBasicFunctionalityEnabled &&
      isSocialLoginUser);

  const shouldWaitForLinkedSocialProfile =
    hasBftConsolidationMarker &&
    !hasLinkedSocialLoginProfile &&
    !isSocialLoginUser &&
    firstTimeFlowType === FirstTimeFlowType.import &&
    isBasicFunctionalityEnabled &&
    (needsSocialPairing || !isSignedIn);

  useEffect(() => {
    if (
      !shouldRunConsolidation ||
      !isUnlocked ||
      !completedOnboarding ||
      shouldWaitForLinkedSocialProfile ||
      isRunning.current
    ) {
      return;
    }

    isRunning.current = true;
    dispatch(consolidateBasicFunctionality()).finally(() => {
      isRunning.current = false;
    });
  }, [
    completedOnboarding,
    dispatch,
    isUnlocked,
    shouldRunConsolidation,
    shouldWaitForLinkedSocialProfile,
  ]);
}
