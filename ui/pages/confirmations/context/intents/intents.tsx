import React, {
  ReactElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Hex } from 'viem';
import { useBestIntentsSource } from '../../hooks/transactions/useBestIntentsSource';

type IntentsToken = {
  chainId: Hex;
  address: Hex;
};

type IntentsContextData = {
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
  sourceToken?: IntentsToken;
  setSourceToken?: (token: IntentsToken) => void;
  success?: boolean;
  setSuccess?: (success: boolean) => void;
};

export const IntentsContext = createContext<IntentsContextData | undefined>(
  undefined,
);

export const IntentsContextProvider: React.FC<{
  children: ReactElement;
}> = ({ children }) => {
  const defaultSourceToken = useBestIntentsSource();
  const [sourceToken, setSourceToken] = useState<IntentsToken>();
  const [loading, setLoading] = useState<boolean>(true);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!sourceToken && defaultSourceToken) {
      setSourceToken(defaultSourceToken);
    }
  }, [defaultSourceToken, sourceToken]);

  const value = useMemo(
    () => ({
      loading,
      setLoading,
      sourceToken,
      setSourceToken,
      success,
      setSuccess,
    }),
    [sourceToken, setSourceToken, loading, setLoading, success, setSuccess],
  );

  return (
    <IntentsContext.Provider value={value}>{children}</IntentsContext.Provider>
  );
};

export function useIntentsContext() {
  const context = useContext(IntentsContext);

  if (!context) {
    throw new Error(
      'useIntentsContext must be used within an IntentsContextProvider',
    );
  }

  return context;
}
