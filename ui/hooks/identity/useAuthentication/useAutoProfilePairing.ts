import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../../ducks/metamask/metamask';
import {
  getMetaMaskKeyrings,
  getUseExternalServices,
} from '../../../selectors';
import { selectHasPairedAtLeastOnce } from '../../../selectors/identity/authentication';
import { performProfilePairing } from '../../../store/actions';

/**
 * Custom hook to manage automatically pairing SRP profiles based on the app state.
 *
 * Fires `performProfilePairing` on first launch (when `hasPairedAtLeastOnce` is
 * false) and whenever a new keyring is added. The controller itself is a no-op
 * when fewer than 2 SRPs exist, so single-SRP wallets are unaffected.
 *
 * @returns An object containing:
 * - `autoProfilePairing`: A function to trigger profile pairing if necessary.
 * - `shouldAutoProfilePairing`: A boolean indicating whether pairing should run.
 */
export function useAutoProfilePairing(): {
  autoProfilePairing: () => Promise<void>;
  shouldAutoProfilePairing: boolean;
} {
  const [hasNewKeyrings, setHasNewKeyrings] = useState(false);
  const dispatch = useDispatch();

  const isUnlocked = Boolean(useSelector(getIsUnlocked));
  const isBasicFunctionalityEnabled = Boolean(
    useSelector(getUseExternalServices),
  );
  const completedOnboarding = Boolean(useSelector(getCompletedOnboarding));
  const hasPairedAtLeastOnce = useSelector(selectHasPairedAtLeastOnce);

  const keyrings = useSelector(getMetaMaskKeyrings);
  const previousKeyringsLength = useRef(keyrings.length);

  useEffect(() => {
    if (keyrings.length !== previousKeyringsLength.current) {
      previousKeyringsLength.current = keyrings.length;
      setHasNewKeyrings(true);
    }
  }, [keyrings.length]);

  const shouldAutoProfilePairing = useMemo(
    () =>
      (!hasPairedAtLeastOnce || hasNewKeyrings) &&
      isUnlocked &&
      isBasicFunctionalityEnabled &&
      completedOnboarding,
    [
      hasPairedAtLeastOnce,
      hasNewKeyrings,
      isUnlocked,
      isBasicFunctionalityEnabled,
      completedOnboarding,
    ],
  );

  const autoProfilePairing = useCallback(async () => {
    if (shouldAutoProfilePairing) {
      await dispatch(performProfilePairing());
      if (hasNewKeyrings) {
        setHasNewKeyrings(false);
      }
    }
  }, [shouldAutoProfilePairing, hasNewKeyrings, dispatch]);

  return {
    autoProfilePairing,
    shouldAutoProfilePairing,
  };
}
