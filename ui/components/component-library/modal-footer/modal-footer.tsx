import React from 'react';
import classnames from 'classnames';

import { FlexDirection } from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import { Button } from '..';

import { ModalFooterProps } from './modal-footer.types';

export const ModalFooter: React.FC<ModalFooterProps> = ({
  className = '',
  children,
  buttonPropsArray,
  ...props
}) => (
  <Box
    className={classnames('mm-modal-footer', className)}
    paddingLeft={4}
    paddingRight={4}
    paddingBottom={4}
    paddingTop={2}
    flexDirection={FlexDirection.Row}
    gap={4}
    {...props}
  >
    {children}
    {buttonPropsArray.map((buttonProp, index) => (
      <Button key={index} {...buttonProp} />
    ))}
  </Box>
);

export default ModalFooter;
