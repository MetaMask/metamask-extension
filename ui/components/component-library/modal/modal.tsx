import React, { forwardRef, Ref, useContext } from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';

import { MetaMetricsContext } from '../../../contexts/metametrics';
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

    // Capture MetaMetrics context to preserve it within the portal
    const metaMetricsContext = useContext(MetaMetricsContext);

    return isOpen
      ? ReactDOM.createPortal(
          <MetaMetricsContext.Provider value={metaMetricsContext}>
            <ModalContext.Provider value={context}>
              <div
                className={classnames('mm-modal', className)}
                ref={ref}
                {...props}
              >
                {children}
              </div>
            </ModalContext.Provider>
          </MetaMetricsContext.Provider>,
          document.body,
        )
      : null;
  },
);

export default Modal;
