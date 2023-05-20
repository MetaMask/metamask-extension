import React, { forwardRef, Ref } from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';

import { ModalProps } from './modal.types';
import { ModalContext } from './modal.context';

export const Modal = forwardRef(
  (
    {
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
    }: ModalProps,
    ref: Ref<HTMLDivElement>,
  ) => {
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
            <div
              className={classnames('mm-modal', className)}
              ref={ref}
              {...props}
            >
              {children}
            </div>
          </ModalContext.Provider>,
          document.body,
        )
      : null;
  },
);

export default Modal;
