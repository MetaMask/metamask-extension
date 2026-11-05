import React, { forwardRef, Ref } from 'react';
import ReactDOM from 'react-dom';
import classnames from 'clsx';
import {
  ModalLayerContext,
  useModalLayer,
} from '#ui/components/app/modal-layer/modal-layer';

import { ModalProps } from './modal.types';
import { ModalContext } from './modal.context';

/**
 * @deprecated This component is deprecated and will be removed in a future release.
 * Please use the Modal component from @metamask/design-system-react instead.
 * @see {@link https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#modal-component | Migration Guide}
 * @see {@link https://metamask.github.io/metamask-design-system/?path=/docs/react-components-modal--docs | Storybook Documentation}
 * @see {@link https://github.com/MetaMask/metamask-design-system/tree/main/packages/design-system-react/src/components/Modal | Component Source}
 */
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
    const layer = useModalLayer(isOpen);
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
          <ModalLayerContext.Provider value={layer}>
            <ModalContext.Provider value={context}>
              <div
                className={classnames('mm-modal', className)}
                ref={ref}
                {...props}
                {...(!layer.isActive && {
                  hidden: true,
                  'aria-hidden': true,
                  style: { display: 'none' },
                })}
              >
                {children}
              </div>
            </ModalContext.Provider>
          </ModalLayerContext.Provider>,
          document.body,
        )
      : null;
  },
);

export default Modal;
