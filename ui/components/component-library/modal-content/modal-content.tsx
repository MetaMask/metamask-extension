import React, { useRef, useEffect } from 'react';
import classnames from 'classnames';

import {
  BackgroundColor,
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
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';

export const ModalContent: ModalContentComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      className = '',
      children,
      size = ModalContentSize.Md,
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
    const handleEscKey = (event: KeyboardEvent) => {
      if (isClosedOnEscapeKey && event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      // Popover should be launched from within Modal but
      // the Popover containing element is a sibling to modal,
      // so this is required to ensure `onClose` isn't triggered
      // when clicking on a popover item
      if (
        isClosedOnOutsideClick &&
        (event.target as HTMLElement).closest('.mm-popover')
      ) {
        return;
      }

      if (
        isClosedOnOutsideClick &&
        modalDialogRef?.current &&
        !modalDialogRef.current.contains(event.target as Node)
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

    const isFullWindow = getEnvironmentType() !== ENVIRONMENT_TYPE_FULLSCREEN;

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
          width={isFullWindow ? '100vw' : BlockSize.Screen}
          height={isFullWindow ? '100vh' : BlockSize.Screen}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          paddingRight={isFullWindow ? 0 : 4}
          paddingLeft={isFullWindow ? 0 : 4}
          paddingTop={isFullWindow ? 0 : [4, 8, 12]}
          paddingBottom={isFullWindow ? 0 : [4, 8, 12]}
          {...(props as BoxProps<C>)}
        >
          <Box
            as="section"
            role="dialog"
            aria-modal="true"
            backgroundColor={BackgroundColor.backgroundDefault}
            borderRadius={BorderRadius.LG}
            width={isFullWindow ? '100vw' : BlockSize.Full}
            height={isFullWindow ? '100vh' : undefined}
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            paddingTop={4}
            paddingBottom={4}
            ref={modalDialogRef}
            {...modalDialogProps}
            className={classnames(
              'mm-modal-content__dialog',
              `mm-modal-content__dialog--size-${size}`,
              isFullWindow ? 'mm-modal-content__dialog--fullscreen-fake' : '',
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
