import React from 'react';
import classnames from 'classnames';

import {
  BackgroundColor,
  BlockSize,
} from '../../../helpers/constants/design-system';

import { Box } from '../box';

import { ModalOverlayProps } from './modal-overlay.types';

export const ModalOverlay: React.FC<ModalOverlayProps> = ({
  onClick,
  className = '',
  ...props
}) => (
  <Box
    className={classnames('mm-modal-overlay', className)}
    backgroundColor={BackgroundColor.overlayDefault}
    width={BlockSize.Full}
    height={BlockSize.Full}
    onClick={onClick}
    aria-hidden="true"
    {...props}
  />
);

export default ModalOverlay;
