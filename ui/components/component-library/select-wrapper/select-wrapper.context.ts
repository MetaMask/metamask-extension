import { useContext, createContext } from 'react';
import { SelectContextType } from './select-wrapper.types';

export const SelectContext = createContext<SelectContextType | undefined>(
  undefined,
);

export const useSelectContext = () => {
  const context = useContext(SelectContext);

  if (!context) {
    throw new Error('useSelectContext must be used within a SelectWrapper');
  }

  return context;
};
