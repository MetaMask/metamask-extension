import React, { memo } from 'react';
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
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

type MenuItemProps = {
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
  iconName: IconName;
  iconColor?: IconColor;
  onClick?: () => void;
  subtitle?: string;
  disabled?: boolean;
  showInfoDot?: boolean;
  textVariant?: TextVariant;
};

const MenuItem = React.forwardRef<HTMLButtonElement, MenuItemProps>(
  (
    {
      children,
      className = '',
      'data-testid': dataTestId,
      iconName,
      iconColor,
      onClick,
      subtitle,
      disabled,
      showInfoDot,
      textVariant,
    }: MenuItemProps,
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
              style={{ '--size': '10px' } as React.CSSProperties}
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
          marginRight={3}
          color={iconColor}
        />
      )}
      <div>
        <Text variant={textVariant} as="div">
          {children}
        </Text>
        {subtitle ? (
          <Text variant={TextVariant.bodyXs} color={TextColor.textAlternative}>
            {subtitle}
          </Text>
        ) : null}
      </div>
    </button>
  ),
);

MenuItem.displayName = 'MenuItem';

export default memo(MenuItem);
