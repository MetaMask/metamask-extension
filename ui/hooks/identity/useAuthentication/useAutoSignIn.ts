import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../../ducks/metamask/metamask';
import {
  getParticipateInMetaMetrics,
  getUseExternalServices,
} from '../../../selectors';
import { selectIsSignedIn } from '../../../selectors/identity/authentication';
import { selectIsProfileSyncingEnabled } from '../../../selectors/identity/profile-syncing';
import { selectIsMetamaskNotificationsEnabled } from '../../../selectors/metamask-notifications/metamask-notifications';
import { useSignIn } from './useSignIn';

/**
 * Custom hook to manage automatically signing in a user based on the app state.
 *
 * @returns An object containing:
 * - `autoSignIn`: A function to automatically sign in the user if necessary.
 * - `shouldAutoSignIn`: A boolean indicating whether the user should be automatically signed in.
 */
export function useAutoSignIn(): {
  autoSignIn: () => Promise<void>;
  shouldAutoSignIn: boolean;
} {
  const { signIn } = useSignIn();

  // Base prerequisites
  const isUnlocked = Boolean(useSelector(getIsUnlocked));
  const isBasicFunctionalityEnabled = Boolean(
    useSelector(getUseExternalServices),
  );
  const completedOnboarding = Boolean(useSelector(getCompletedOnboarding));
  const isSignedIn = useSelector(selectIsSignedIn);

  const areBasePrerequisitesMet = useMemo(
    () =>
      !isSignedIn &&
      isUnlocked &&
      isBasicFunctionalityEnabled &&
      completedOnboarding,
    [isSignedIn, isUnlocked, isBasicFunctionalityEnabled, completedOnboarding],
  );

  // Auth dependent features
  const isProfileSyncingEnabled = useSelector(selectIsProfileSyncingEnabled);
  const isParticipateInMetaMetrics = useSelector(getParticipateInMetaMetrics);
  const isNotificationServicesEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );

  const isAtLeastOneAuthDependentFeatureEnabled = useMemo(
    () =>
      isProfileSyncingEnabled ||
      isParticipateInMetaMetrics ||
      isNotificationServicesEnabled,
    [
      isProfileSyncingEnabled,
      isParticipateInMetaMetrics,
      isNotificationServicesEnabled,
    ],
  );

  const shouldAutoSignIn = useMemo(() => {
    return areBasePrerequisitesMet && isAtLeastOneAuthDependentFeatureEnabled;
  }, [areBasePrerequisitesMet, isAtLeastOneAuthDependentFeatureEnabled]);

  const autoSignIn = useCallback(async () => {
    if (shouldAutoSignIn) {
      await signIn();
    }
  }, [shouldAutoSignIn, signIn]);

  return {
    autoSignIn,
    shouldAutoSignIn,
  };
}
