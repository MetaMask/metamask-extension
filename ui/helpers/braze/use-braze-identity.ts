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
 * profile ID is available. Re-identifies only when that ID changes. This is
 * also the only path that initializes the SDK: startup does not initialize
 * Braze, so locked, signed-out, and basic-functionality-off documents never
 * load or activate it.
 *
 * Wipes local Braze data on sign-out or when basic functionality is turned
 * off — in the document that observes the transition. A document that opens
 * already signed out never initialized the SDK, so stale persisted data stays
 * inert there and is re-keyed by the next `changeUser`. Does not wipe on
 * lock.
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
        identifyBrazeUser(canonicalProfileId)
          .then((didIdentify) => {
            if (didIdentify) {
              identifiedProfileIdRef.current = canonicalProfileId;
              hasIdentifiedRef.current = true;
            }
          })
          .catch(console.error);
      }
      return;
    }

    if (
      hasIdentifiedRef.current &&
      (!isSignedIn || !isBasicFunctionalityEnabled)
    ) {
      clearBrazeUser().catch(console.error);
      identifiedProfileIdRef.current = undefined;
      hasIdentifiedRef.current = false;
    }
  }, [isUnlocked, isBasicFunctionalityEnabled, isSignedIn, canonicalProfileId]);
}
