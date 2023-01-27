import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Icon, ICON_SIZES } from '../../component-library';

const MenuItem = ({
  children,
  className,
  'data-testid': dataTestId,
  iconClassName,
  iconName,
  onClick,
  subtitle,
}) => (
  <button
    className={classnames('menu-item', className)}
    data-testid={dataTestId}
    onClick={onClick}
  >
    {iconClassName ? (
      <i className={classnames('menu-item__icon', iconClassName)} />
    ) : null}
    {iconName ? (
      <Icon name={iconName} size={ICON_SIZES.SM} marginRight={2} />
    ) : null}
    <span>{children}</span>
    {subtitle}
  </button>
);

MenuItem.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  'data-testid': PropTypes.string,
  iconClassName: PropTypes.string,
  iconName: PropTypes.string,
  onClick: PropTypes.func,
  subtitle: PropTypes.node,
};

MenuItem.defaultProps = {
  className: undefined,
  'data-testid': undefined,
  iconClassName: undefined,
  iconName: undefined,
  onClick: undefined,
  subtitle: undefined,
};

export default MenuItem;
