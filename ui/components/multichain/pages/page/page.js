import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Box } from '../../../component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';

export const Page = ({
  header = null,
  footer = null,
  children,
  className = '',
  ...props
}) => {
  return (
    <Box
      display={Display.Flex}
      width={BlockSize.Full}
      flexDirection={FlexDirection.Column}
      style={{ height: '100%' }}
      className={classnames('multichain-page', className)}
      {...props}
    >
      {header}
      {children}
      {footer}
    </Box>
  );
};

Page.propTypes = {
  header: PropTypes.element,
  footer: PropTypes.element,
  className: PropTypes.string,
  children: PropTypes.node,
};
