import React from 'react';

export interface FocusableElement {
  focus(options?: FocusOptions): void;
}

export interface ModalFocusProps {
  /**
   * The `ref` of the element to receive focus initially
   */
  initialFocusRef?: React.RefObject<FocusableElement>;
  /**
   * The `ref` of the element to return focus to when `ModalFocus`
   * unmounts
   */
  finalFocusRef?: React.RefObject<FocusableElement>;
  /**
   * If `true`, focus will be restored to the element that
   * triggered the `ModalFocus` once it unmounts
   *
   * @default false
   */
  restoreFocus?: boolean;
  /**
   * The node to lock focus to
   */
  children: React.ReactNode;
  /**
   * If `true`, the first focusable element within the `children`
   * will auto-focused once `ModalFocus` mounts
   *
   * @default false
   */
  autoFocus?: boolean;
}
