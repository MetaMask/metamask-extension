import React from 'react';
import classnames from 'classnames';

import {
  BackgroundColor,
  BlockSize,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import { ModalBodyProps } from './modal-body.types';

export const ModalBody: React.FC<ModalBodyProps> = ({
  className = '',
  children,
  ...props
}) => (
  <Box
    className={classnames('mm-modal-body', className)}
    paddingLeft={4}
    paddingRight={4}
    {...props}
  >
    {children}
  </Box>
);

export default ModalBody;
