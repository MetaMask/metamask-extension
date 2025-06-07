import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../../ducks/metamask/metamask';
import {
  getMetaMaskKeyrings,
  getParticipateInMetaMetrics,
  getUseExternalServices,
} from '../../../selectors';
import { selectIsSignedIn } from '../../../selectors/identity/authentication';
import { selectIsBackupAndSyncEnabled } from '../../../selectors/identity/backup-and-sync';
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
  const [hasNewKeyrings, setHasNewKeyrings] = useState(false);
  const { signIn } = useSignIn();

  // Base prerequisites
  const isUnlocked = Boolean(useSelector(getIsUnlocked));
  const isBasicFunctionalityEnabled = Boolean(
    useSelector(getUseExternalServices),
  );
  const completedOnboarding = Boolean(useSelector(getCompletedOnboarding));
  const isSignedIn = useSelector(selectIsSignedIn);

  const keyrings = useSelector(getMetaMaskKeyrings);
  const previousKeyringsLength = useRef(keyrings.length);

  useEffect(() => {
    if (keyrings.length !== previousKeyringsLength.current) {
      previousKeyringsLength.current = keyrings.length;
      setHasNewKeyrings(true);
    }
  }, [keyrings.length]);

  const areBasePrerequisitesMet = useMemo(
    () =>
      (!isSignedIn || hasNewKeyrings) &&
      isUnlocked &&
      isBasicFunctionalityEnabled &&
      completedOnboarding,
    [
      isSignedIn,
      isUnlocked,
      isBasicFunctionalityEnabled,
      completedOnboarding,
      hasNewKeyrings,
    ],
  );

  // Auth dependent features
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const isParticipateInMetaMetrics = useSelector(getParticipateInMetaMetrics);
  const isNotificationServicesEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );

  const isAtLeastOneAuthDependentFeatureEnabled = useMemo(
    () =>
      isBackupAndSyncEnabled ||
      isParticipateInMetaMetrics ||
      isNotificationServicesEnabled,
    [
      isBackupAndSyncEnabled,
      isParticipateInMetaMetrics,
      isNotificationServicesEnabled,
    ],
  );

  const shouldAutoSignIn = useMemo(() => {
    return areBasePrerequisitesMet && isAtLeastOneAuthDependentFeatureEnabled;
  }, [areBasePrerequisitesMet, isAtLeastOneAuthDependentFeatureEnabled]);

  const autoSignIn = useCallback(async () => {
    if (shouldAutoSignIn) {
      if (hasNewKeyrings) {
        await signIn(true);
        setHasNewKeyrings(false);
      }
      await signIn();
    }
  }, [shouldAutoSignIn, signIn, hasNewKeyrings]);

  return {
    autoSignIn,
    shouldAutoSignIn,
  };
}
