import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Box } from '../../../../../component-library';
import {
  BlockSize,
  Display,
} from '../../../../../../helpers/constants/design-system';

export const Footer = ({ children, className = '', ...props }) => {
  return (
    <Box
      padding={4}
      display={Display.Flex}
      width={BlockSize.Full}
      gap={4}
      className={classnames('multichain-page-footer', className)}
      {...props}
    >
      {children}
    </Box>
  );
};

Footer.propTypes = {
  /**
   * Elements that go in the page footer
   */
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string,
  ]).isRequired,
  /**
   * Additional CSS class provided to the content
   */
  className: PropTypes.string,
};
