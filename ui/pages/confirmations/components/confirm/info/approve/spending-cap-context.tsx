import PropTypes from 'prop-types';
import React, { createContext, ReactNode, useContext, useState } from 'react';

const SpendingCapContext = createContext<{
  customSpendingCap: string;
  setCustomSpendingCap: (newCap: string) => void;
} | null>(null);

export const SpendingCapProvider = ({ children }: { children: ReactNode }) => {
  const [customSpendingCap, setCustomSpendingCap] = useState('');

  return (
    <SpendingCapContext.Provider
      value={{ customSpendingCap, setCustomSpendingCap }}
    >
      {children}
    </SpendingCapContext.Provider>
  );
};

export const useSpendingCapContext = () => {
  const context = useContext(SpendingCapContext);
  if (!context) {
    throw new Error(
      'useSpendingCapContext must be used within an SpendingCapProvider',
    );
  }
  return context;
};

SpendingCapProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
