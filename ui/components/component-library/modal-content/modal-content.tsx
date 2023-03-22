import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import classnames from 'classnames';

import {
  BackgroundColor,
  BorderRadius,
  BLOCK_SIZES,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import { ModalContentProps, ModalContentSize } from './modal-content.types';

export const ModalContent = forwardRef<HTMLElement, ModalContentProps>(
  (
    {
      children,
      size = ModalContentSize.Md,
      className = '',
      ...props
    }: ModalContentProps,
    ref,
  ) => {
    const boxRef = useRef<HTMLElement>(null);

    useImperativeHandle(ref, () => boxRef.current);

    return (
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
        ref={boxRef}
        {...props}
      >
        {children}
      </Box>
    );
  },
);
