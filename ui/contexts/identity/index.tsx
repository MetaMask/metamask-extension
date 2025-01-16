import React, { useEffect } from 'react';
import { useAccountSyncing } from '../../hooks/identity/useProfileSyncing';
import { useAutoSignIn } from '../../hooks/identity/useAuthentication';

export const MetamaskIdentityProvider: React.FC = ({ children }) => {
  const { dispatchAccountSyncing, shouldDispatchAccountSyncing } =
    useAccountSyncing();
  const { autoSignIn, shouldAutoSignIn } = useAutoSignIn();

  useEffect(() => {
    if (shouldDispatchAccountSyncing) {
      dispatchAccountSyncing();
    }
  }, [shouldDispatchAccountSyncing, dispatchAccountSyncing]);

  useEffect(() => {
    if (shouldAutoSignIn()) {
      autoSignIn();
    }
  }, [shouldAutoSignIn, autoSignIn]);

  return <>{children}</>;
};
