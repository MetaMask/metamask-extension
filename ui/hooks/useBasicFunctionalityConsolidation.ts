import { useEffect, useRef } from 'react';
import { getCompletedOnboarding } from '../ducks/metamask/metamask';
import { getIsUnlocked } from '../ducks/metamask/base-selectors';
import { getIsBasicFunctionalityToggleEnabled } from '../selectors/multichain/feature-flags';
import { getIsBasicFunctionalitySocialLoginUser } from '../selectors/onboarding/onboarding';
import { getIsBasicFunctionalityMigrationPending } from '../selectors/multichain/basic-functionality';
import { consolidateBasicFunctionality } from '../store/actions';
import { useAppSelector, useDispatch } from '../store/hooks';

/**
 * Runs one-time Basic Functionality consolidation when the remote flag is on,
 * and repairs a persisted consolidated social-login wallet if Basic
 * Functionality is off.
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
  const isPending = useAppSelector(getIsBasicFunctionalityMigrationPending);
  const isAcknowledged = useAppSelector((state) =>
    Boolean(
      state.metamask.preferences
        ?.basicFunctionalityMigrationNotificationDismissed,
    ),
  );
  const shouldRunConsolidation =
    !isPending &&
    ((isBftConsolidationRemoteEnabled && !hasBftConsolidationMarker) ||
      (hasBftConsolidationMarker &&
        !isBasicFunctionalityEnabled &&
        isSocialLoginUser &&
        !isAcknowledged));

  useEffect(() => {
    if (
      !shouldRunConsolidation ||
      !isUnlocked ||
      !completedOnboarding ||
      isRunning.current
    ) {
      return;
    }

    isRunning.current = true;
    dispatch(consolidateBasicFunctionality()).finally(() => {
      isRunning.current = false;
    });
  }, [completedOnboarding, dispatch, isUnlocked, shouldRunConsolidation]);
}
