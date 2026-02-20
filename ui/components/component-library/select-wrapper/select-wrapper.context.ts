import { createContext } from 'react';
import { SelectContextType } from './select-wrapper.types';

export const SelectContext = createContext<SelectContextType | undefined>(
  undefined,
);
