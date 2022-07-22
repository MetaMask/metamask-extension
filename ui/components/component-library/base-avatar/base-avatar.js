import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../ui/box/box';

function BaseAvatar(props) {
  const { size } = props;
  return (
    <Box
      className={classnames('base-avatar', ` --size-${size}`)}
      data-testid="base-avatar "
    ></Box>
  );
}

BaseAvatar.propTypes = {
  /**
   * To control the size i.e height and width of the avatar
   * Possible values could be 'xs', 'sm', 'md', 'lg', 'xl'
   */
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
};

export default BaseAvatar;
