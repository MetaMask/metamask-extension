import React, { memo } from 'react';
import classnames from 'classnames';
import { Link } from 'react-router-dom';

import {
  IconName as IconNameNew,
  IconColor as IconColorNew,
} from '@metamask/design-system-react';
import {
  BadgeWrapper,
  BadgeWrapperAnchorElementShape,
  BadgeWrapperPosition,
  Icon,
  IconName as IconNameDeprecated,
  IconSize,
  Text,
  Box,
} from '../../component-library';
import {
  BackgroundColor,
  BorderRadius,
  Display,
  IconColor as IconColorDeprecated,
  TextColor as TextColorDeprecated,
  TextVariant as TextVariantDeprecated,
} from '../../../helpers/constants/design-system';

type MenuItemProps = {
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
  /**
   * Accepts both deprecated IconName from component-library and new IconName from @metamask/design-system-react
   * Using string to allow both enum types without TypeScript strictness issues
   */
  iconName: IconNameDeprecated | IconNameNew | string;
  /**
   * Accepts both deprecated IconColor from design-system and new IconColor from @metamask/design-system-react
   * Using string to allow both enum types without TypeScript strictness issues
   */
  iconColor?: IconColorDeprecated | IconColorNew | string;
  iconSize?: IconSize;
  to?: string;
  onClick?: () => void;
  subtitle?: string;
  disabled?: boolean;
  showInfoDot?: boolean;
  /**
   * Accepts both deprecated TextVariant from design-system and new TextVariant from @metamask/design-system-react
   * Using string to allow both enum types without TypeScript strictness issues
   */
  textVariant?: string;
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
      iconSize = IconSize.Sm,
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
            positionObj={{ top: 0, right: 4 }}
            badge={
              <Box
                style={{ width: '10px', height: '10px', content: '' }}
                borderRadius={BorderRadius.full}
                backgroundColor={BackgroundColor.primaryDefault}
              />
            }
          >
            <Icon
              name={iconName as unknown as IconNameDeprecated}
              size={iconSize}
              marginRight={2}
            />
          </BadgeWrapper>
        )}
        {iconName && !showInfoDot && (
          <Icon
            name={iconName as unknown as IconNameDeprecated}
            size={iconSize}
            marginRight={3}
            color={iconColor as unknown as IconColorDeprecated}
          />
        )}
        <div>
          <Text
            variant={textVariant as unknown as TextVariantDeprecated}
            as="div"
          >
            {children}
          </Text>
          {subtitle ? (
            <Text
              variant={TextVariantDeprecated.bodyXs}
              color={TextColorDeprecated.textAlternative}
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
