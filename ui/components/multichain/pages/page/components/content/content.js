import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Box } from '../../../../../component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../../../helpers/constants/design-system';

export const Content = ({ children, className = '', ...props }) => {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      width={BlockSize.Full}
      padding={4}
      height={BlockSize.Full}
      className={classnames('multichain-page-content', className)}
      {...props}
    >
      {children}
    </Box>
  );
};

Content.propTypes = {
  /**
   * Elements that go in the page content section
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
