import React, {
  ReactElement,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type SampleContexType = {
  counter: number;
  updateCounter: (amount: number) => void;
};

export const SampleContext = createContext<SampleContexType | undefined>(
  undefined,
);

export function SampleContextProvider({ children }: { children: ReactElement }) {
  const [counter, setCounter] = useState(0);

  const updateCounter = useCallback((amount: number) => {
    setCounter((prevCounter) => prevCounter + amount);
  }, []);

  const value = useMemo(
    () => ({
      counter,
      updateCounter,
    }),
    [counter],
  );

  return <SampleContext.Provider value={value}>{children}</SampleContext.Provider>

};

export function useSampleContext(): SampleContexType {
  const context = useContext(SampleContext);

  if (!context) {
    throw new Error(
      'useSampleContext must be used within a SampleContextProvider',
    );
  }

  return context;
};
