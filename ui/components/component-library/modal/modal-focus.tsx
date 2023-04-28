import React, { useCallback } from 'react';
import ReactFocusLock from 'react-focus-lock';
import type { ModalFocusProps } from './modal-focus.types';

/**
 * Based on the ModalFocusScope component from chakra-ui
 * https://github.com/chakra-ui/chakra-ui/blob/main/packages/components/modal/src/modal-focus.tsx
 */

const FocusTrap: typeof ReactFocusLock =
  (ReactFocusLock as any).default ?? ReactFocusLock;

export const ModalFocus: React.FC<ModalFocusProps> = ({
  initialFocusRef,
  finalFocusRef,
  modalDialogRef,
  restoreFocus,
  children,
  autoFocus,
}) => {
  const onActivation = useCallback(() => {
    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    } else if (modalDialogRef?.current) {
      modalDialogRef.current?.focus();
    }
  }, [initialFocusRef, modalDialogRef]);

  const onDeactivation = useCallback(() => {
    finalFocusRef?.current?.focus();
  }, [finalFocusRef]);

  const returnFocus = restoreFocus && !finalFocusRef;

  return (
    <FocusTrap
      autoFocus={autoFocus}
      onActivation={onActivation}
      onDeactivation={onDeactivation}
      returnFocus={returnFocus}
    >
      {children}
    </FocusTrap>
  );
};

ModalFocus.displayName = 'ModalFocus';
