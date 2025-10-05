import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const NavStateContext = createContext(null);
const SetNavStateContext = createContext(() => {});

export function NavigationStateProvider({ children }) {
  const [navState, setNavState] = useState(null);

  return (
    <NavStateContext.Provider value={navState}>
      <SetNavStateContext.Provider value={setNavState}>
        {children}
      </SetNavStateContext.Provider>
    </NavStateContext.Provider>
  );
}

NavigationStateProvider.propTypes = {
  children: PropTypes.node,
};

export function useNavState() {
  return useContext(NavStateContext);
}

export function useSetNavState() {
  return useContext(SetNavStateContext);
}
