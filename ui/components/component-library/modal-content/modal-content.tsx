import React, { forwardRef } from 'react';
import classnames from 'classnames';

import {
  BackgroundColor,
  BorderRadius,
  BLOCK_SIZES,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import { ModalContentProps, ModalContentSize } from './modal-content.types';

export const ModalContent: React.ForwardRefExoticComponent<ModalContentProps> =
  forwardRef(
    (
      {
        children,
        size = ModalContentSize.Md,
        className = '',
        ...props
      }: ModalContentProps,
      ref,
    ) => (
      <Box
        className={classnames(
          'mm-modal-content',
          `mm-modal-content--size-${size}`,
          className,
        )}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.LG}
        width={BLOCK_SIZES.FULL}
        padding={4}
        ref={ref}
        {...props}
      >
        {children}
      </Box>
    ),
  );
