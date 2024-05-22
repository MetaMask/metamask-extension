import React from 'react';
import { ReactElement, createContext, useCallback, useContext } from 'react';

type AlertActionHandlerContextType = {
  processAction: (actionKey: string) => void;
};

export const AlertActionHandlerContext = createContext<
  AlertActionHandlerContextType | undefined
>(undefined);

export const AlertActionHandlerProvider: React.FC<{
  children: ReactElement;
}> = ({ children }) => {
  // eslint-disable-next-line no-empty-function
  const process action = useCallback((_actionKey: string) => {}, []);

  return (
    <AlertActionHandlerContext.Provider value={{ processAction }}>
      {children}
    </AlertActionHandlerContext.Provider>
  );
};

export const useAlertActionHandler = () => {
  const context = useContext(AlertActionHandlerContext);
  if (!context) {
    throw new Error(
      'useAlertActionHandler must be used within an AlertActionHandlerProvider',
    );
  }
  return context;
};
