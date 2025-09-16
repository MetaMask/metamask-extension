import React, { memo } from 'react';
import classnames from 'classnames';
import { Link } from 'react-router-dom-v5-compat';

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
  to?: string;
  onClick?: () => void;
  subtitle?: string;
  disabled?: boolean;
  showInfoDot?: boolean;
  textVariant?: TextVariant;
};

const MenuItem = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  MenuItemProps
>(
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
      to,
    }: MenuItemProps,
    ref,
  ) => {
    const content = (
      <>
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
            <Text
              variant={TextVariant.bodyXs}
              color={TextColor.textAlternative}
            >
              {subtitle}
            </Text>
          ) : null}
        </div>
      </>
    );

    if (to) {
      return disabled ? (
        <span
          className={classnames('menu-item', className)}
          data-testid={dataTestId}
          ref={ref as React.Ref<HTMLSpanElement>}
        >
          {content}
        </span>
      ) : (
        <Link
          to={to}
          className={classnames('menu-item', className)}
          data-testid={dataTestId}
          ref={ref as React.Ref<HTMLAnchorElement>}
          onClick={onClick}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        className={classnames('menu-item', className)}
        data-testid={dataTestId}
        disabled={disabled}
        ref={ref as React.Ref<HTMLButtonElement>}
        onClick={onClick}
      >
        {content}
      </button>
    );
  },
);

MenuItem.displayName = 'MenuItem';

export default memo(MenuItem);
