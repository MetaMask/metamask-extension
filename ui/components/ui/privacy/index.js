import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import { getPrivacyModeEnabled } from '../../../selectors';

export default function Privacy({ as = 'div', children, className }) {
  const privacyModeEnabled = useSelector(getPrivacyModeEnabled);

  const Component = as;
  return (
    <Component
      className={classnames(className, { privacy: privacyModeEnabled })}
    >
      {children}
    </Component>
  );
}

Privacy.propTypes = {
  as: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};
