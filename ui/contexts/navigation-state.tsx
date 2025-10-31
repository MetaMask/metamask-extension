import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react';

// Define types
type NavState = Record<string, unknown> | null;
type SetNavState = Dispatch<SetStateAction<NavState>>;

// Create contexts
const NavStateContext = createContext<NavState | null>(null);
const SetNavStateContext = createContext<SetNavState>(() => {
  // noop default
});

type NavigationStateProviderProps = {
  children: ReactNode;
};

export function NavigationStateProvider({
  children,
}: NavigationStateProviderProps) {
  const [navState, setNavState] = useState<NavState | null>(null);

  return (
    <NavStateContext.Provider value={navState}>
      <SetNavStateContext.Provider value={setNavState}>
        {children}
      </SetNavStateContext.Provider>
    </NavStateContext.Provider>
  );
}

export function useNavState(): NavState | null {
  return useContext(NavStateContext);
}

export function useSetNavState(): SetNavState {
  return useContext(SetNavStateContext);
}
