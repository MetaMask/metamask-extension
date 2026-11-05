import React, { useRef } from 'react';
import classnames from 'clsx';
import { useModalEvents } from '#ui/components/app/modal-layer/use-modal-events';

import {
  BackgroundColor,
  BorderColor,
  BorderRadius,
  BlockSize,
  Display,
  JustifyContent,
  AlignItems,
  FlexDirection,
} from '../../../helpers/constants/design-system';

import { Box, BoxProps } from '../box';
import type { PolymorphicRef } from '../box';
import { useModalContext } from '../modal/modal.context';
import { ModalFocus } from '../modal-focus';
import {
  ModalContentProps,
  ModalContentSize,
  ModalContentComponent,
} from './modal-content.types';

/**
 * @deprecated This component is deprecated and will be removed in a future release.
 * Please use the ModalContent component from @metamask/design-system-react instead.
 * @see {@link https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#modalcontent-component | Migration Guide}
 * @see {@link https://metamask.github.io/metamask-design-system/?path=/docs/react-components-modalcontent--docs | Storybook Documentation}
 * @see {@link https://github.com/MetaMask/metamask-design-system/tree/main/packages/design-system-react/src/components/ModalContent | Component Source}
 */
export const ModalContent: ModalContentComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'div'>(
    {
      className = '',
      children,
      size = ModalContentSize.Sm,
      modalDialogProps,
      ...props
    }: ModalContentProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const {
      onClose,
      isClosedOnEscapeKey,
      isClosedOnOutsideClick,
      initialFocusRef,
      finalFocusRef,
      restoreFocus,
      autoFocus,
    } = useModalContext();
    const modalDialogRef = useRef<HTMLElement>(null);
    useModalEvents({
      dialogRef: modalDialogRef,
      onClose,
      isClosedOnEscapeKey,
      isClosedOnOutsideClick,
    });
    return (
      <ModalFocus
        initialFocusRef={initialFocusRef}
        finalFocusRef={finalFocusRef}
        restoreFocus={restoreFocus}
        autoFocus={autoFocus}
      >
        <Box
          className={classnames('mm-modal-content', className)}
          ref={ref}
          display={Display.Flex}
          width={BlockSize.Screen}
          height={BlockSize.Screen}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.flexStart}
          paddingRight={4}
          paddingLeft={4}
          paddingTop={[4, 8, 12]}
          paddingBottom={[4, 8, 12]}
          {...(props as BoxProps<C>)}
        >
          <Box
            as="section"
            role="dialog"
            aria-modal="true"
            backgroundColor={BackgroundColor.backgroundElevated1}
            borderColor={BorderColor.borderAlternative}
            borderWidth={1}
            width={BlockSize.Full}
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            paddingTop={4}
            paddingBottom={4}
            ref={modalDialogRef}
            {...modalDialogProps}
            className={classnames(
              'rounded-[32px]',
              'mm-modal-content__dialog',
              `mm-modal-content__dialog--size-${size}`,
              modalDialogProps?.className,
            )}
          >
            {children}
          </Box>
        </Box>
      </ModalFocus>
    );
  },
);
