import React, { useEffect } from 'react';
import { useAccountSyncing } from '../../hooks/identity/useAccountSyncing';
import { useContactSyncing } from '../../hooks/identity/useContactSyncing';
import {
  useAutoSignIn,
  useAutoSignOut,
} from '../../hooks/identity/useAuthentication';

export const MetamaskIdentityProvider: React.FC = ({ children }) => {
  const { dispatchAccountSyncing, shouldDispatchAccountSyncing } =
    useAccountSyncing();
  const { dispatchContactSyncing, shouldDispatchContactSyncing } =
    useContactSyncing();
  const { autoSignIn, shouldAutoSignIn } = useAutoSignIn();
  const { autoSignOut, shouldAutoSignOut } = useAutoSignOut();

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
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31878
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      autoSignIn();
    }
  }, [shouldAutoSignIn, autoSignIn]);

  useEffect(() => {
    if (shouldAutoSignOut) {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31878
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      autoSignOut();
    }
  }, [shouldAutoSignOut, autoSignOut]);

  return <>{children}</>;
};
