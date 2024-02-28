import React, { Ref, forwardRef } from 'react';
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

interface MenuItemProps {
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
  iconName?: IconName;
  iconColor?: IconColor;
  onClick?: () => void;
  subtitle?: React.ReactNode;
  disabled?: boolean;
  showInfoDot?: boolean;
}

const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
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
    ref: Ref<HTMLButtonElement>,
  ) => (
    <button
      className={classnames('menu-item', className || '')}
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
              style={{ '--size': '10px' } as any}
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

MenuItem.displayName = 'MenuItem';

export default MenuItem;
