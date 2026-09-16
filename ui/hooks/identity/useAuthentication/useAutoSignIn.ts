import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getCompletedOnboarding } from '../../../ducks/metamask/metamask';
import { getIsUnlocked } from '../../../ducks/metamask/base-selectors';
import {
  getMetaMaskKeyrings,
  getUseExternalServices,
} from '../../../selectors';
import {
  selectIsSignedIn,
  selectNeedsProfilePairing,
  selectNeedsSocialPairing,
} from '../../../selectors/identity/authentication';
import { getIsSocialLoginFlow } from '../../../selectors/first-time-flow';
import { getIsBasicFunctionalityConsolidationEnabled } from '../../../selectors/multichain/basic-functionality';
import { requestProfilePairing } from '../../../store/actions';
import { useDispatch } from '../../../store/hooks';
import { useSignIn } from './useSignIn';

/**
 * Custom hook to manage automatically signing in a user based on the app state.
 *
 * Also drives profile pairing: when a new keyring/SRP is added, it dispatches
 * `requestProfilePairing()` so the controller's `needsProfilePairing` flag
 * flips to `true`. That, in turn, re-arms the gate below and triggers a
 * forced `performSignIn` (`signIn(true)`) which re-runs the pairing logic
 * inside the controller. The same forced sign-in path is used for social
 * identifier pairing when a social-login user still needs pairing and the
 * Basic Functionality consolidation experience is on.
 *
 * @returns An object containing:
 * - `autoSignIn`: A function to automatically sign in the user if necessary.
 * - `shouldAutoSignIn`: A boolean indicating whether the user should be automatically signed in.
 */
export function useAutoSignIn(): {
  autoSignIn: () => Promise<void>;
  shouldAutoSignIn: boolean;
} {
  const dispatch = useDispatch();
  const [hasNewKeyrings, setHasNewKeyrings] = useState(false);
  const { signIn } = useSignIn();

  // Base prerequisites
  const isUnlocked = Boolean(useSelector(getIsUnlocked));
  const isBasicFunctionalityEnabled = Boolean(
    useSelector(getUseExternalServices),
  );
  const completedOnboarding = Boolean(useSelector(getCompletedOnboarding));
  const isSignedIn = useSelector(selectIsSignedIn);
  const needsProfilePairing = useSelector(selectNeedsProfilePairing);
  const needsSocialPairing = useSelector(selectNeedsSocialPairing);
  const isSocialLoginFlow = Boolean(useSelector(getIsSocialLoginFlow));
  const isBftConsolidationEnabled = Boolean(
    useSelector(getIsBasicFunctionalityConsolidationEnabled),
  );
  const shouldSocialPair =
    needsSocialPairing && isSocialLoginFlow && isBftConsolidationEnabled;

  const keyrings = useSelector(getMetaMaskKeyrings);
  const previousKeyringsLength = useRef(keyrings.length);

  useEffect(() => {
    if (keyrings.length !== previousKeyringsLength.current) {
      previousKeyringsLength.current = keyrings.length;
      setHasNewKeyrings(true);
      // Tell the controller a re-pair is needed so the gate fires even when
      // we are already signed in. The controller flips `needsProfilePairing`
      // back to `false` once `performSignIn` (re-)pairs successfully; if pair
      // fails, the flag stays `true` and the next eligible state shift
      // retries.
      dispatch(requestProfilePairing());
    }
  }, [keyrings.length, dispatch]);

  const shouldAutoSignIn = useMemo(
    () =>
      (!isSignedIn ||
        hasNewKeyrings ||
        needsProfilePairing ||
        shouldSocialPair) &&
      isUnlocked &&
      isBasicFunctionalityEnabled &&
      completedOnboarding,
    [
      isSignedIn,
      isUnlocked,
      isBasicFunctionalityEnabled,
      completedOnboarding,
      hasNewKeyrings,
      needsProfilePairing,
      shouldSocialPair,
    ],
  );

  const autoSignIn = useCallback(async () => {
    if (shouldAutoSignIn) {
      // Force `performSignIn` whenever the SRP set may have changed (new
      // keyring) or pairing has not yet succeeded for the current SRP set.
      // `signIn()` (no force) is the steady-state initial-sign-in path used
      // when the user is simply not signed in yet.
      if (hasNewKeyrings || needsProfilePairing || shouldSocialPair) {
        await signIn(true);
        setHasNewKeyrings(false);
      } else {
        await signIn();
      }
    }
  }, [
    shouldAutoSignIn,
    signIn,
    hasNewKeyrings,
    needsProfilePairing,
    shouldSocialPair,
  ]);

  return {
    autoSignIn,
    shouldAutoSignIn,
  };
}
