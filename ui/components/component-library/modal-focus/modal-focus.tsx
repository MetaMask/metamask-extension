import React, { useCallback } from 'react';
import ReactFocusLock from 'react-focus-lock';
import type { ModalFocusProps } from './modal-focus.types';

/**
 * Based on the ModalFocusScope component from chakra-ui
 * https://github.com/chakra-ui/chakra-ui/blob/main/packages/components/modal/src/modal-focus.tsx
 *
 * @deprecated This component is deprecated and will be removed in a future release.
 * Please use the ModalFocus component from @metamask/design-system-react instead.
 * @see {@link https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#modalfocus-component | Migration Guide}
 * @see {@link https://metamask.github.io/metamask-design-system/?path=/docs/react-components-modalfocus--docs | Storybook Documentation}
 * @see {@link https://github.com/MetaMask/metamask-design-system/tree/main/packages/design-system-react/src/components/ModalFocus | Component Source}
 */

const FocusTrap: typeof ReactFocusLock =
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ReactFocusLock as any).default ?? ReactFocusLock;

export const ModalFocus = ({
  initialFocusRef,
  finalFocusRef,
  restoreFocus,
  children,
  autoFocus,
  ...props
}: React.PropsWithChildren<ModalFocusProps>) => {
  const onActivation = useCallback(() => {
    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    }
  }, [initialFocusRef]);

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
      {...props}
    >
      {children}
    </FocusTrap>
  );
};

ModalFocus.displayName = 'ModalFocus';
