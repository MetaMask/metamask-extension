import React, { useEffect } from 'react';
import { useAccountSyncing } from '../../hooks/identity/useAccountSyncing';
import { useContactSyncing } from '../../hooks/identity/useContactSyncing';
import { useRampsOrderSyncing } from '../../hooks/identity/useRampsOrderSyncing/useRampsOrderSyncing';
import {
  useAutoSignIn,
  useAutoSignOut,
} from '../../hooks/identity/useAuthentication';
import { useBrazeIdentity } from '../../helpers/braze/use-braze-identity';

export const MetamaskIdentityProvider = ({
  children,
}: React.PropsWithChildren<unknown>) => {
  const { dispatchAccountSyncing, shouldDispatchAccountSyncing } =
    useAccountSyncing();
  const { dispatchContactSyncing, shouldDispatchContactSyncing } =
    useContactSyncing();
  const { dispatchRampsOrderSyncing, shouldDispatchRampsOrderSyncing } =
    useRampsOrderSyncing();
  const { autoSignIn, shouldAutoSignIn } = useAutoSignIn();
  const { autoSignOut, shouldAutoSignOut } = useAutoSignOut();
  useBrazeIdentity();

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

  useEffect(() => {
    if (shouldDispatchRampsOrderSyncing) {
      dispatchRampsOrderSyncing();
    }
  }, [shouldDispatchRampsOrderSyncing, dispatchRampsOrderSyncing]);

  /**
   * Authentication effects
   *
   * - Users should be automatically signed in based on various conditions. (see `useAutoSignIn`).
   * - Users should be signed out if basic functionality is disabled. (see `useAutoSignOut`)
   * - Braze is identified with the canonical profile ID after sign-in. (see `useBrazeIdentity`)
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
