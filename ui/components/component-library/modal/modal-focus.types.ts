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
   * The `ref` of the wrapper for which the focus-lock wraps
   * This should generally be the ModalContent element
   */
  modalContentRef?: React.RefObject<HTMLElement>;
  /**
   * If `true`, focus will be restored to the element that
   * triggered the `ModalFocus` once it unmounts
   *
   * @default false
   */
  restoreFocus?: boolean;
  /**
   * The modal components to render generally ModalOverlay and ModalContent
   */
  children: React.ReactNode;
  /**
   * If `true`, the first focusable element within the `children`
   * will auto-focused once `ModalFocus` mounts
   *
   * @default false
   */
  autoFocus?: boolean;
  /**
   * If `true`, the modal will return focus to the element that triggered it when it closes.
   *
   * @default true
   */
  returnFocusOnClose?: boolean;
}
