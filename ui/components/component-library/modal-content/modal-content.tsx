import React, { forwardRef, useRef, useEffect } from 'react';
import classnames from 'classnames';

import {
  BackgroundColor,
  BorderRadius,
  BLOCK_SIZES,
  DISPLAY,
  JustifyContent,
  AlignItems,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import { ModalFocus, useModalContext } from '..';

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
          display={DISPLAY.FLEX}
          width={BLOCK_SIZES.SCREEN}
          height={BLOCK_SIZES.SCREEN}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.flexStart}
          padding={4}
          {...props}
        >
          <Box
            className={classnames(
              'mm-modal-content__dialog',
              `mm-modal-content__dialog--size-${size}`,
            )}
            as="section"
            role="dialog"
            aria-modal="true"
            backgroundColor={BackgroundColor.backgroundDefault}
            borderRadius={BorderRadius.LG}
            width={BLOCK_SIZES.FULL}
            marginTop={12}
            marginBottom={12}
            padding={4}
            ref={modalDialogRef}
            {...modalDialogProps}
          >
            {children}
          </Box>
        </Box>
      </ModalFocus>
    );
  },
);
