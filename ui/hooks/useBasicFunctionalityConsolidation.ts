import { useEffect, useRef } from 'react';
import { getCompletedOnboarding } from '../ducks/metamask/metamask';
import { getIsUnlocked } from '../ducks/metamask/base-selectors';
import { getIsBasicFunctionalityToggleEnabled } from '../selectors/multichain/feature-flags';
import { consolidateBasicFunctionality } from '../store/actions';
import { useAppSelector, useDispatch } from '../store/hooks';

/**
 * When the Basic Functionality consolidation remote FF turns on, run the
 * one-time preference consolidation (and schedule modal/toast if needed).
 */
export function useBasicFunctionalityConsolidation(): void {
  const dispatch = useDispatch();
  const isRunning = useRef(false);

  const isToggleEnabled = useAppSelector(getIsBasicFunctionalityToggleEnabled);
  const isConsolidated = useAppSelector((state) =>
    Boolean(
      state.metamask.preferences?.isBasicFunctionalityConsolidatedEnabled,
    ),
  );
  const isUnlocked = useAppSelector(getIsUnlocked);
  const completedOnboarding = useAppSelector(getCompletedOnboarding);

  useEffect(() => {
    if (
      !isToggleEnabled ||
      isConsolidated ||
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
  }, [
    completedOnboarding,
    dispatch,
    isConsolidated,
    isToggleEnabled,
    isUnlocked,
  ]);
}
