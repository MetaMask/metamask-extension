import React, { useEffect } from 'react';
import { useAccountSyncing } from '../../hooks/identity/useAccountSyncing';
import { useContactSyncing } from '../../hooks/identity/useContactSyncing';
import {
  useAutoSignIn,
  useAutoSignOut,
} from '../../hooks/identity/useAuthentication';

export const MetamaskIdentityProvider = ({
  children,
}: React.PropsWithChildren<unknown>) => {
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
    let cancelled = false;

    const run = async () => {
      if (!shouldAutoSignIn || cancelled) {
        return;
      }
      await autoSignIn();
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [shouldAutoSignIn, autoSignIn]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!shouldAutoSignOut || cancelled) {
        return;
      }
      await autoSignOut();
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [shouldAutoSignOut, autoSignOut]);

  return <>{children}</>;
};
