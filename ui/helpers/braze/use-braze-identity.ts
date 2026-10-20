import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getIsUnlocked } from '../../ducks/metamask/base-selectors';
import { getCompletedOnboarding } from '../../ducks/metamask/metamask';
import { getUseExternalServices } from '../../selectors';
import {
  selectCanonicalProfileId,
  selectIsSignedIn,
} from '../../selectors/identity/authentication';
import { clearBrazeUser, identifyBrazeUser } from './identify-braze-user';

/**
 * Sync the document's Braze identity with Profile Sync and basic functionality.
 * Initialization waits for completed onboarding and an unlocked, signed-in
 * wallet with a canonical ID.
 * Sign-out and basic-functionality opt-out clear the active SDK; lock does not.
 */
export function useBrazeIdentity(): void {
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const isBasicFunctionalityEnabled = useSelector(getUseExternalServices);
  const isSignedIn = useSelector(selectIsSignedIn);
  const canonicalProfileId = useSelector(selectCanonicalProfileId);

  useEffect(() => {
    // Basic Functionality defaults to true before the user can choose. Onboarding
    // applies that choice before setting completedOnboarding.
    if (!completedOnboarding || !isSignedIn || !isBasicFunctionalityEnabled) {
      clearBrazeUser();
    } else if (isUnlocked && canonicalProfileId) {
      identifyBrazeUser(canonicalProfileId);
    }
  }, [
    completedOnboarding,
    isUnlocked,
    isBasicFunctionalityEnabled,
    isSignedIn,
    canonicalProfileId,
  ]);
}
