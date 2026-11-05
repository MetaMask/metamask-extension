import React, { useContext } from 'react';
import ReactFocusLock from 'react-focus-lock';
import type { ModalFocusProps } from '@metamask/design-system-react';
import { ModalLayerContext, useModalActivity } from './modal-layer';

const FocusTrap =
  (
    ReactFocusLock as typeof ReactFocusLock & {
      default?: typeof ReactFocusLock;
    }
  ).default ?? ReactFocusLock;

/** Pause focus enforcement without unmounting a suspended modal's form. */
export function ModalFocus({
  initialFocusRef,
  finalFocusRef,
  restoreFocus,
  autoFocus,
  children,
}: ModalFocusProps) {
  const layer = useContext(ModalLayerContext);
  const isActive = useModalActivity();
  return (
    <FocusTrap
      disabled={!isActive}
      autoFocus={autoFocus}
      onActivation={() => initialFocusRef?.current?.focus()}
      onDeactivation={() => {
        // Preemption keeps the request registered; only a real close restores focus.
        if (isActive && !layer?.isRegistered()) {
          finalFocusRef?.current?.focus();
        }
      }}
      returnFocus={
        layer
          ? (target) =>
              Boolean(
                restoreFocus &&
                !finalFocusRef &&
                !layer?.isRegistered() &&
                !target.closest('[hidden], [inert]'),
              )
          : restoreFocus && isActive && !finalFocusRef
      }
    >
      {children}
    </FocusTrap>
  );
}
ModalFocus.displayName = 'ModalFocus';
