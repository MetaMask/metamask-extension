import React from 'react';
import classnames from 'classnames';

import {
  BackgroundColor,
  BorderRadius,
  BLOCK_SIZES,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import { ModalContentProps, ModalContentSize } from './modal-content.types';

export const ModalContent = ({
  className = '',
  children,
  size = ModalContentSize.Sm,
  width,
  modalContentRef, // Would have preferred to forwardRef but it's not trivial in TypeScript. Will update once we have an established pattern
  ...props
}: ModalContentProps) => (
  <Box
    className={classnames(
      'mm-modal-content',
      { [`mm-modal-content--size-${size}`]: !width },
      className,
    )}
    as="section"
    role="dialog"
    aria-modal="true"
    backgroundColor={BackgroundColor.backgroundDefault}
    borderRadius={BorderRadius.LG}
    width={width || BLOCK_SIZES.FULL}
    padding={4}
    ref={modalContentRef}
    {...props}
  >
    {children}
  </Box>
);
