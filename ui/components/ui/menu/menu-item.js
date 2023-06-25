import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Text, Icon, IconSize } from '../../component-library';
import { TextVariant } from '../../../helpers/constants/design-system';

const MenuItem = React.forwardRef(
  (
    {
      children,
      className,
      'data-testid': dataTestId,
      iconName,
      onClick,
      subtitle,
      disabled = false,
    },
    ref,
  ) => (
    <button
      className={classnames('menu-item', className)}
      data-testid={dataTestId}
      onClick={onClick}
      ref={ref}
      disabled={disabled}
    >
      {iconName ? (
        <Icon name={iconName} size={IconSize.Sm} marginRight={2} />
      ) : null}
      <div>
        <div>{children}</div>
        {subtitle ? <Text variant={TextVariant.bodyXs}>{subtitle}</Text> : null}
      </div>
    </button>
  ),
);

MenuItem.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  'data-testid': PropTypes.string,
  iconName: PropTypes.string,
  onClick: PropTypes.func,
  subtitle: PropTypes.node,
  disabled: PropTypes.bool,
};

MenuItem.displayName = 'MenuItem';

export default MenuItem;
