import React, { ReactElement, createContext, useContext } from 'react';

import useCurrentConfirmation from '../../hooks/useCurrentConfirmation';
import syncConfirmPath from '../../hooks/syncConfirmPath';
import { Confirmation } from '../../types/confirm';

type ConfirmContextType = {
  currentConfirmation: Confirmation;
};

export const ConfirmContext = createContext<ConfirmContextType | undefined>(
  undefined,
);

export const ConfirmContextProvider: React.FC<{
  children: ReactElement;
}> = ({ children }) => {
  const { currentConfirmation } = useCurrentConfirmation();
  syncConfirmPath(currentConfirmation);

  return (
    <ConfirmContext.Provider value={{ currentConfirmation }}>
      {children}
    </ConfirmContext.Provider>
  );
};

export const useConfirmContext = <T = Confirmation,>() => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error(
      'useConfirmContext must be used within an ConfirmContextProvider',
    );
  }
  return context as { currentConfirmation: T };
};
