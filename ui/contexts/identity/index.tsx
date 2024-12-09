import React, { createContext, useContext, useEffect } from 'react';
import { useAccountSyncing } from '../../hooks/identity/useProfileSyncing';

const MetamaskIdentityContext = createContext(undefined);

export const useMetamaskIdentityContext = () => {
  const context = useContext(MetamaskIdentityContext);
  if (!context) {
    throw new Error(
      'useMetamaskIdentityContext must be used within a MetamaskIdentityProvider',
    );
  }
  return context;
};

export const MetamaskIdentityProvider: React.FC = ({ children }) => {
  const { dispatchAccountSyncing, shouldDispatchAccountSyncing } =
    useAccountSyncing();

  useEffect(() => {
    if (shouldDispatchAccountSyncing) {
      dispatchAccountSyncing();
    }
  }, [shouldDispatchAccountSyncing, dispatchAccountSyncing]);

  return (
    <MetamaskIdentityContext.Provider value={undefined}>
      {children}
    </MetamaskIdentityContext.Provider>
  );
};
