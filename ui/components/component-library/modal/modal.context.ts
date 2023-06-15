import { createContext, useContext } from 'react';

import type { ModalProps } from './modal.types';

export type ModalContextType = Omit<ModalProps, 'children'>;

export const ModalContext = createContext<ModalContextType | undefined>(
  undefined,
);

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error(
      'useModalContext must be used within a ModalProvider, Seems you forgot to wrap the components in "<Modal />"',
    );
  }
  return context;
};
