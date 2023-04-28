import React, { forwardRef, useRef, useContext, useEffect } from 'react';
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

import { ModalFocus, ModalContext } from '../modal';

import { ModalContentProps, ModalContentSize } from './modal-content.types';

export const ModalContent = forwardRef(
  (
    {
      className = '',
      children,
      size = ModalContentSize.Sm,
      width,
      modalDialogProps,
      ...props
    }: ModalContentProps,
    ref: React.Ref<HTMLElement>,
  ) => {
    const modalDialogRef = useRef<HTMLElement>(null);
    const {
      autoFocus,
      initialFocusRef,
      finalFocusRef,
      restoreFocus,
      isClosedOnEscapeKey,
      isClosedOnOutsideClick,
      onClose,
    } = useContext(ModalContext);
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
        <ModalFocus
          autoFocus={autoFocus}
          initialFocusRef={initialFocusRef}
          finalFocusRef={finalFocusRef}
          restoreFocus={restoreFocus}
          modalDialogRef={modalDialogRef}
        >
          <Box
            className={classnames('mm-modal-content__dialog', {
              [`mm-modal-content__dialog--size-${size}`]:
                !modalDialogProps?.width,
            })}
            as="section"
            role="dialog"
            aria-modal="true"
            backgroundColor={BackgroundColor.backgroundDefault}
            borderRadius={BorderRadius.LG}
            width={width || BLOCK_SIZES.FULL}
            marginTop={12}
            marginBottom={12}
            padding={4}
            ref={modalDialogRef}
            {...modalDialogProps}
          >
            {children}
          </Box>
        </ModalFocus>
      </Box>
    );
  },
);
