import React from 'react';
import classnames from 'classnames';

import {
  BackgroundColor,
  BLOCK_SIZES,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import { ModalOverlayProps } from './modal-overlay.types';

export const ModalOverlay: React.FC<ModalOverlayProps> = ({
  onClick,
  className = '',
  ...props
}) => (
  <Box
    className={classnames('mm-modal-overlay', className)}
    backgroundColor={BackgroundColor.overlayDefault}
    width={BLOCK_SIZES.FULL}
    height={BLOCK_SIZES.FULL}
    onClick={onClick}
    aria-hidden="true"
    {...props}
  />
);

export default ModalOverlay;
