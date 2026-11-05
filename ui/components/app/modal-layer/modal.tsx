import React, { forwardRef } from 'react';
import {
  Modal as DesignSystemModal,
  type ModalProps as DesignSystemModalProps,
} from '@metamask/design-system-react';
import { ModalLayerContext, ModalPriority, useModalLayer } from './modal-layer';

export type ModalProps = DesignSystemModalProps & {
  /** Higher priority dialogs suspend ordinary dialogs until they close. */
  priority?: ModalPriority;
};

/** MMDS modal with shared visibility, dismissal, and focus ownership. */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ isOpen, priority, style, children, ...props }, ref) => {
    const layer = useModalLayer(isOpen, priority);
    return (
      <ModalLayerContext.Provider value={layer}>
        <DesignSystemModal
          {...props}
          ref={ref}
          isOpen={isOpen}
          hidden={!layer.isActive}
          aria-hidden={!layer.isActive || undefined}
          style={{ ...style, ...(!layer.isActive && { display: 'none' }) }}
        >
          {children}
        </DesignSystemModal>
      </ModalLayerContext.Provider>
    );
  },
);
Modal.displayName = 'Modal';
