import React, { useEffect } from 'react';
import { useAccountSyncing } from '../../hooks/identity/useProfileSyncing';
import {
  useAutoSignIn,
  useAutoSignOut,
} from '../../hooks/identity/useAuthentication';

export const MetamaskIdentityProvider: React.FC = ({ children }) => {
  const { dispatchAccountSyncing, shouldDispatchAccountSyncing } =
    useAccountSyncing();
  const { autoSignIn, shouldAutoSignIn } = useAutoSignIn();
  const { autoSignOut, shouldAutoSignOut } = useAutoSignOut();

  /**
   * Profile syncing effects
   */
  useEffect(() => {
    if (shouldDispatchAccountSyncing) {
      dispatchAccountSyncing();
    }
  }, [shouldDispatchAccountSyncing, dispatchAccountSyncing]);

  /**
   * Authentication effects
   *
   * - Users should be automatically signed in based on various conditions. (see `useAutoSignIn`).
   * - Users should be signed out if basic functionality is disabled. (see `useAutoSignOut`)
   */
  useEffect(() => {
    if (shouldAutoSignIn) {
      autoSignIn();
    }
  }, [shouldAutoSignIn, autoSignIn]);

  useEffect(() => {
    if (shouldAutoSignOut) {
      autoSignOut();
    }
  }, [shouldAutoSignOut, autoSignOut]);

  return <>{children}</>;
};
