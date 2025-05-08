import classnames from 'classnames';
import React from 'react';
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
  iconName?: IconName;
  iconColor?: string;
  onClick?: () => void;
  subtitle?: React.ReactNode;
  disabled?: boolean;
  showInfoDot?: boolean;
  isRedesign?: boolean;
};

const MenuItem = React.forwardRef(
  (
    {
      children,
      className = '',
      'data-testid': dataTestId,
      iconName,
      iconColor,
      onClick,
      subtitle,
      disabled = false,
      showInfoDot,
      isRedesign = false,
    }: MenuItemProps,
    ref: React.Ref<HTMLButtonElement>,
  ) => (
    <button
      className={classnames(
        'menu-item',
        className,
        isRedesign ? 'redesign-menu-item' : '',
      )}
      data-testid={dataTestId}
      onClick={onClick}
      ref={ref as React.Ref<HTMLButtonElement>}
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
          color={iconColor as IconColor}
        />
      )}
      <div>
        <Text as="div">{children}</Text>
        {subtitle ? (
          <Text variant={isRedesign ? TextVariant.bodyMdMedium : undefined} color={TextColor.textAlternative}>
            {subtitle}
          </Text>
        ) : null}
      </div>
    </button>
  ),
);

MenuItem.displayName = 'MenuItem';

export default React.memo(MenuItem);
