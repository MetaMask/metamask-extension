import React, { createContext } from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';

import Box from '../../ui/box/box';

import { ModalProps } from './modal.types';

const defaultModalProps = {
  isOpen: false,
  onClose: () => {},
  children: null,
};

export const ModalContext = createContext<ModalProps>(defaultModalProps);

export const Modal: React.FC<ModalProps> = ({
  className = '',
  isOpen,
  onClose,
  children,
  isClosedOnOutsideClick = true,
  isClosedOnEscapeKey = true,
  autoFocus = true,
  initialFocusRef,
  finalFocusRef,
  restoreFocus,
  ...props
}) => {
  const context = {
    isOpen,
    onClose,
    isClosedOnOutsideClick,
    isClosedOnEscapeKey,
    autoFocus,
    initialFocusRef,
    finalFocusRef,
    restoreFocus,
  };

  return isOpen
    ? ReactDOM.createPortal(
        <ModalContext.Provider value={context}>
          <Box className={classnames('mm-modal', className)} {...props}>
            {children}
          </Box>
        </ModalContext.Provider>,
        document.body,
      )
    : null;
};

export default Modal;
