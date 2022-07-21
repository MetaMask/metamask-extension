import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import './index.scss';

function AvatarBase(props) {
  const { size } = props;
  return <div className={classnames('avatar-base', ` --size-${size}`)}></div>;
}

AvatarBase.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
};

export default AvatarBase;
