import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  BadgeWrapper,
  BadgeWrapperAnchorElementShape,
  BadgeWrapperPosition,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../component-library';
import {
  Display,
  IconColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

const MenuItem = React.forwardRef(
  (
    {
      children,
      className,
      'data-testid': dataTestId,
      iconName,
      iconColor,
      onClick,
      subtitle,
      disabled = false,
      showInfoDot,
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
      {iconName && showInfoDot && (
        <BadgeWrapper
          anchorElementShape={BadgeWrapperAnchorElementShape.circular}
          display={Display.Block}
          position={BadgeWrapperPosition.topRight}
          positionObj={{ top: -6, right: 4 }}
          badge={
            <Icon
              name={IconName.FullCircle}
              size={IconSize.Xs}
              color={IconColor.primaryDefault}
              style={{ '--size': '10px' }}
            />
          }
        >
          <Icon name={iconName} size={IconSize.Sm} marginRight={2} />
        </BadgeWrapper>
      )}
      {iconName && !showInfoDot && (
        <Icon
          name={iconName}
          size={IconSize.Sm}
          marginRight={2}
          color={iconColor}
        />
      )}
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
  showInfoDot: PropTypes.bool,
  iconColor: PropTypes.string,
};

MenuItem.displayName = 'MenuItem';

export default MenuItem;
