import { useEffect, useRef } from 'react';
import { shouldStartBasicFunctionalityConsolidation } from '../../shared/lib/basic-functionality-consolidation';
import { getIsBasicFunctionalityConsolidationEnabledInBuild } from '../../shared/lib/environment';
import { getCompletedOnboarding } from '../ducks/metamask/metamask';
import { getIsUnlocked } from '../ducks/metamask/base-selectors';
import { selectNeedsSocialPairing } from '../selectors/identity/authentication';
import { getIsBasicFunctionalityToggleEnabled } from '../selectors/multichain/feature-flags';
import { getShouldRepairBasicFunctionalitySocialMigrationNotice } from '../selectors/multichain/basic-functionality';
import { getIsBasicFunctionalitySocialLoginUser } from '../selectors/onboarding/onboarding';
import { consolidateBasicFunctionality } from '../store/actions';
import { useAppSelector, useDispatch } from '../store/hooks';

/**
 * Runs one-time Basic Functionality consolidation when the remote flag is on,
 * or when the build flag is on for BF-off wallets that cannot fetch remote
 * flags. Also repairs a persisted consolidated social-login wallet if Basic
 * Functionality is off, or schedules the social migration modal when pairing
 * classification was lost after SRP import/restore.
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
  const isBasicFunctionalityEnabled = useAppSelector(
    (state) => state.metamask.useExternalServices,
  );
  const isUnlocked = useAppSelector(getIsUnlocked);
  const completedOnboarding = useAppSelector(getCompletedOnboarding);
  const isSocialLoginUser = useAppSelector(
    getIsBasicFunctionalitySocialLoginUser,
  );
  const needsSocialMigrationNoticeRepair = useAppSelector(
    getShouldRepairBasicFunctionalitySocialMigrationNotice,
  );
  const needsSocialPairing = useAppSelector(selectNeedsSocialPairing);
  const isBftRolloutActive =
    isBftConsolidationRemoteEnabled ||
    getIsBasicFunctionalityConsolidationEnabledInBuild();
  const shouldWaitForSocialPairing =
    isBftRolloutActive &&
    needsSocialPairing &&
    isBasicFunctionalityEnabled &&
    !isSocialLoginUser;

  const shouldRunConsolidation =
    shouldStartBasicFunctionalityConsolidation({
      isRemoteFlagEnabled: isBftConsolidationRemoteEnabled,
      isBuildFlagEnabled: getIsBasicFunctionalityConsolidationEnabledInBuild(),
      useExternalServices: isBasicFunctionalityEnabled,
      hasConsolidationMarker: hasBftConsolidationMarker,
    }) ||
    (hasBftConsolidationMarker &&
      !isBasicFunctionalityEnabled &&
      isSocialLoginUser) ||
    needsSocialMigrationNoticeRepair;

  useEffect(() => {
    if (
      !shouldRunConsolidation ||
      !isUnlocked ||
      !completedOnboarding ||
      shouldWaitForSocialPairing ||
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
    shouldWaitForSocialPairing,
  ]);
}
