import React, {
  ReactElement,
  createContext,
  useCallback,
  useContext,
} from 'react';

type AlertActionHandlerContextType = {
  processAction: (actionKey: string) => void;
};

export const AlertActionHandlerContext = createContext<
  AlertActionHandlerContextType | undefined
>(undefined);

export const AlertActionHandlerProvider: React.FC<{
  children: ReactElement;
  onProcessAction: (actionKey: string) => void;
}> = ({ children, onProcessAction }) => {
  const processAction = useCallback(
    (_actionKey: string) => {
      onProcessAction(_actionKey);
    },
    [onProcessAction],
  );

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
