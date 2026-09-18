import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getIsUnlocked } from '../../ducks/metamask/base-selectors';
import { getUseExternalServices } from '../../selectors';
import {
  selectCanonicalProfileId,
  selectIsSignedIn,
} from '../../selectors/identity/authentication';
import { clearBrazeUser, identifyBrazeUser } from './identify-braze-user';

/**
 * Syncs Braze identity with Profile Sync sign-in in this UI document.
 *
 * Identifies with `changeUser(canonicalProfileId)` when the wallet is
 * unlocked, basic functionality is on, the user is signed in, and a canonical
 * profile ID is available. Re-identifies only when that ID changes.
 *
 * Wipes local Braze data on sign-out or when basic functionality is turned
 * off. Does not wipe on lock, and does not wipe on the initial signed-out
 * mount.
 *
 * Does not call `openSession` and is not driven by Segment `identify`.
 */
export function useBrazeIdentity(): void {
  const isUnlocked = Boolean(useSelector(getIsUnlocked));
  const isBasicFunctionalityEnabled = Boolean(
    useSelector(getUseExternalServices),
  );
  const isSignedIn = useSelector(selectIsSignedIn);
  const canonicalProfileId = useSelector(selectCanonicalProfileId);
  const identifiedProfileIdRef = useRef<string | undefined>(undefined);
  const hasIdentifiedRef = useRef(false);

  useEffect(() => {
    if (
      isUnlocked &&
      isBasicFunctionalityEnabled &&
      isSignedIn &&
      canonicalProfileId
    ) {
      if (identifiedProfileIdRef.current !== canonicalProfileId) {
        identifyBrazeUser(canonicalProfileId);
        identifiedProfileIdRef.current = canonicalProfileId;
        hasIdentifiedRef.current = true;
      }
      return;
    }

    if (
      hasIdentifiedRef.current &&
      (!isSignedIn || !isBasicFunctionalityEnabled)
    ) {
      clearBrazeUser();
      identifiedProfileIdRef.current = undefined;
      hasIdentifiedRef.current = false;
    }
  }, [isUnlocked, isBasicFunctionalityEnabled, isSignedIn, canonicalProfileId]);
}
