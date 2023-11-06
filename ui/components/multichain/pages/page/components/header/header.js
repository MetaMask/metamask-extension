import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { HeaderBase, Text } from '../../../../../component-library';
import {
  BlockSize,
<<<<<<< HEAD
=======
  Display,
>>>>>>> upstream/multichain-swaps-controller
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
    <HeaderBase
      padding={4}
      width={BlockSize.Full}
      className={classnames('multichain-page-header', className)}
      startAccessory={startAccessory}
      endAccessory={endAccessory}
      {...props}
    >
<<<<<<< HEAD
      <Text variant={TextVariant.bodyMdBold} textAlign={TextAlign.Center}>
=======
      <Text
        display={Display.Block}
        variant={TextVariant.bodyMdBold}
        textAlign={TextAlign.Center}
        paddingInlineStart={8}
        paddingInlineEnd={8}
        ellipsis
      >
>>>>>>> upstream/multichain-swaps-controller
        {children}
      </Text>
    </HeaderBase>
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
<<<<<<< HEAD
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.element])
    .isRequired,
=======
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string,
  ]).isRequired,
>>>>>>> upstream/multichain-swaps-controller
  /**
   * Any element to place at the end of the header
   */
  endAccessory: PropTypes.element,
  /**
   * Any element to place at the start of the header
   */
  startAccessory: PropTypes.element,
};
