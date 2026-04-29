import React, { useEffect } from 'react';
import { useAccountSyncing } from '../../hooks/identity/useAccountSyncing';
import { useContactSyncing } from '../../hooks/identity/useContactSyncing';
import {
  useAutoSignIn,
  useAutoSignOut,
  useAutoProfilePairing,
} from '../../hooks/identity/useAuthentication';

export const MetamaskIdentityProvider: React.FC = ({ children }) => {
  const { dispatchAccountSyncing, shouldDispatchAccountSyncing } =
    useAccountSyncing();
  const { dispatchContactSyncing, shouldDispatchContactSyncing } =
    useContactSyncing();
  const { autoSignIn, shouldAutoSignIn } = useAutoSignIn();
  const { autoSignOut, shouldAutoSignOut } = useAutoSignOut();
  const { autoProfilePairing, shouldAutoProfilePairing } =
    useAutoProfilePairing();

  /**
   * Backup and sync effects
   */
  useEffect(() => {
    if (shouldDispatchAccountSyncing) {
      dispatchAccountSyncing();
    }
  }, [shouldDispatchAccountSyncing, dispatchAccountSyncing]);

  useEffect(() => {
    if (shouldDispatchContactSyncing) {
      dispatchContactSyncing();
    }
  }, [shouldDispatchContactSyncing, dispatchContactSyncing]);

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

  useEffect(() => {
    if (shouldAutoProfilePairing) {
      autoProfilePairing();
    }
  }, [shouldAutoProfilePairing, autoProfilePairing]);

  return <>{children}</>;
};
