import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getIsUnlocked } from '../../../ducks/metamask/metamask';
import { getUseExternalServices } from '../../../selectors';
import { selectIsSignedIn } from '../../../selectors/identity/authentication';
import { useSignOut } from './useSignOut';

/**
 * Custom hook to manage automatically signing out a user based on the app state.
 *
 * @returns An object containing:
 * - `autoSignOut`: A function to automatically sign out the user if necessary.
 * - `shouldAutoSignOut`: A boolean indicating whether the user should be automatically signed out.
 */
export function useAutoSignOut(): {
  autoSignOut: () => Promise<void>;
  shouldAutoSignOut: boolean;
} {
  const { signOut } = useSignOut();

  // Base prerequisites
  const isUnlocked = Boolean(useSelector(getIsUnlocked));
  const isBasicFunctionalityEnabled = Boolean(
    useSelector(getUseExternalServices),
  );
  const isSignedIn = useSelector(selectIsSignedIn);

  const areBasePrerequisitesMet = useMemo(
    () => isSignedIn && isUnlocked && !isBasicFunctionalityEnabled,
    [isSignedIn, isUnlocked, isBasicFunctionalityEnabled],
  );

  const shouldAutoSignOut = useMemo(
    () => areBasePrerequisitesMet,
    [areBasePrerequisitesMet],
  );

  const autoSignOut = useCallback(async () => {
    if (shouldAutoSignOut) {
      await signOut();
    }
  }, [shouldAutoSignOut, signOut]);

  return {
    autoSignOut,
    shouldAutoSignOut,
  };
}
