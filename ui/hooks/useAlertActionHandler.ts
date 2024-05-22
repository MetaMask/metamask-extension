import { createContext, useContext } from 'react';

type AlertActionHandlerContextType = {
  processAction: (actionKey: string) => void;
};

export const AlertActionHandlerContext = createContext<
  AlertActionHandlerContextType | undefined
>(undefined);

export const useAlertActionHandler = () => {
  const context = useContext(AlertActionHandlerContext);
  if (!context) {
    throw new Error(
      'useAlertActionHandler must be used within an AlertActionHandlerProvider',
    );
  }
  return context;
};
