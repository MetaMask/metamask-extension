import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Text } from '../../component-library';
import { Icon, ICON_SIZES } from '../../component-library/icon/deprecated';
import { TextVariant } from '../../../helpers/constants/design-system';

const MenuItem = ({
  children,
  className,
  'data-testid': dataTestId,
  iconName,
  onClick,
  subtitle,
}) => (
  <button
    className={classnames('menu-item', className)}
    data-testid={dataTestId}
    onClick={onClick}
  >
    {iconName ? (
      <Icon name={iconName} size={ICON_SIZES.SM} marginRight={2} />
    ) : null}
    <div>
      <div>{children}</div>
      {subtitle ? <Text variant={TextVariant.bodyXs}>{subtitle}</Text> : null}
    </div>
  </button>
);

MenuItem.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  'data-testid': PropTypes.string,
  iconName: PropTypes.string,
  onClick: PropTypes.func,
  subtitle: PropTypes.node,
};

MenuItem.defaultProps = {
  className: undefined,
  'data-testid': undefined,
  iconName: undefined,
  onClick: undefined,
  subtitle: undefined,
};

export default MenuItem;
