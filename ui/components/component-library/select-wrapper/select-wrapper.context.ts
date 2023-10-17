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

// Custom hook to access the uncontrolledValue
export function useUncontrolledValue() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('useUncontrolledValue must be used within a SelectWrapper');
  }
  return context.uncontrolledValue;
}
