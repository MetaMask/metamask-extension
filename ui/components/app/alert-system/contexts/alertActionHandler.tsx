import React, {
  ReactElement,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';

type AlertActionHandlerContextType = {
  processAction: (actionKey: string) => void;
};

export const AlertActionHandlerContext = createContext<
  AlertActionHandlerContextType | undefined
>(undefined);

export const AlertActionHandlerProvider = ({
  children,
  onProcessAction,
}: React.PropsWithChildren<{
  children: ReactElement;
  onProcessAction: (actionKey: string) => void;
}>) => {
  const processAction = useCallback(
    (_actionKey: string) => {
      onProcessAction(_actionKey);
    },
    [onProcessAction],
  );

  const contextValue = useMemo(() => ({ processAction }), [processAction]);

  return (
    <AlertActionHandlerContext.Provider value={contextValue}>
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
