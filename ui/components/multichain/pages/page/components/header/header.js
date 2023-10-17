import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Box, HeaderBase, Text } from '../../../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  TextAlign,
  TextVariant,
} from '../../../../../../helpers/constants/design-system';

export const Header = ({
  children,
  endAccessory = null,
  startAccessory = null,
  className = '',
  ...props
}) => {
  return (
    <Box className="multichain-page-header">
      <HeaderBase
        padding={4}
        width={BlockSize.Full}
        className={classnames('multichain-page-header__contents', className)}
        startAccessory={startAccessory}
        endAccessory={endAccessory}
        {...props}
      >
        <Text
          as="div"
          display={Display.Block}
          variant={TextVariant.bodyMdBold}
          textAlign={TextAlign.Center}
          paddingInlineStart={8}
          paddingInlineEnd={8}
          ellipsis
        >
          {children}
        </Text>
      </HeaderBase>
    </Box>
  );
};

Header.propTypes = {
  /**
   * Additional CSS class provided to the header
   */
  className: PropTypes.string,
  /**
   * Elements that go in the page footer
   */
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string,
  ]).isRequired,
  /**
   * Any element to place at the end of the header
   */
  endAccessory: PropTypes.element,
  /**
   * Any element to place at the start of the header
   */
  startAccessory: PropTypes.element,
};
