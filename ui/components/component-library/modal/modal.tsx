import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';

import {
  AlignItems,
  BLOCK_SIZES,
  DISPLAY,
  JustifyContent,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';
import { ModalFocus } from './modal-focus';

import { ModalProps } from './modal.types';

export const Modal: React.FC<ModalProps> = ({
  className = '',
  isOpen,
  onClose,
  children,
  modalContentRef,
  isClosedOnOutsideClick = true,
  isClosedOnEscapeKey = true,
  autoFocus = true,
  initialFocusRef,
  finalFocusRef,
  restoreFocus,
  ...props
}) => {
  const handleEscKey = (event: KeyboardEvent) => {
    if (isClosedOnEscapeKey && event.key === 'Escape') {
      onClose();
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      isClosedOnOutsideClick &&
      modalContentRef?.current &&
      !modalContentRef.current.contains(event.target as Node)
    ) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleEscKey);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return isOpen
    ? ReactDOM.createPortal(
        <Box
          className={classnames('mm-modal', className)}
          display={DISPLAY.FLEX}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          width={BLOCK_SIZES.FULL}
          height={BLOCK_SIZES.FULL}
          padding={4}
          {...props}
        >
          <ModalFocus
            autoFocus={autoFocus}
            initialFocusRef={initialFocusRef}
            finalFocusRef={finalFocusRef}
            restoreFocus={restoreFocus}
            modalContentRef={modalContentRef}
          >
            {children}
          </ModalFocus>
        </Box>,
        document.body,
      )
    : null;
};

export default Modal;
