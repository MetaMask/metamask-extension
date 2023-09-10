import React, { forwardRef, useRef, useEffect } from 'react';
import classnames from 'classnames';

import {
  BackgroundColor,
  BorderRadius,
  BlockSize,
  Display,
  JustifyContent,
  AlignItems,
} from '../../../helpers/constants/design-system';

import { Box, ModalFocus, useModalContext } from '..';

import { ModalContentProps, ModalContentSize } from './modal-content.types';

export const ModalContent = forwardRef(
  (
    {
      className = '',
      children,
      size = ModalContentSize.Sm,
      modalDialogProps,
      ...props
    }: ModalContentProps,
    ref: React.Ref<HTMLElement>,
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
          {...props}
        >
          <Box
            as="section"
            role="dialog"
            aria-modal="true"
            backgroundColor={BackgroundColor.backgroundDefault}
            borderRadius={BorderRadius.LG}
            width={BlockSize.Full}
            padding={4}
            ref={modalDialogRef}
            {...modalDialogProps}
            className={classnames(
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
