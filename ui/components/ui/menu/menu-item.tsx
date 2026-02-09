import React, { memo } from 'react';
import { Link } from 'react-router-dom';

import {
  BadgeWrapper,
  BadgeWrapperPosition,
  BadgeStatus,
  BadgeStatusStatus,
  Icon,
  IconName,
  IconSize,
  Text,
  TextVariant,
  TextColor,
  twMerge,
} from '@metamask/design-system-react';
import {
  Icon as IconLegacy,
  IconName as IconNameLegacy,
  IconSize as IconSizeLegacy,
  Text as TextLegacy,
} from '../../component-library';
import {
  IconColor as IconColorLegacy,
  TextVariant as TextVariantLegacy,
} from '../../../helpers/constants/design-system';

type MenuItemProps = {
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
  // Legacy props from component-library (kept for backward compatibility)
  iconNameLegacy?: IconNameLegacy;
  iconColorLegacy?: IconColorLegacy;
  textVariantLegacy?: TextVariantLegacy;
  // New props from @metamask/design-system-react
  iconName?: IconName;
  iconSize?: IconSize;
  textVariant?: TextVariant;
  to?: string;
  onClick?: () => void;
  subtitle?: string;
  disabled?: boolean;
  showInfoDot?: boolean;
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
      iconNameLegacy,
      iconColorLegacy,
      textVariantLegacy,
      iconName,
      iconSize,
      textVariant,
      onClick,
      subtitle,
      disabled,
      showInfoDot,
      to,
    }: MenuItemProps,
    ref,
  ) => {
    // Determine which icon and text system to use
    const useNewSystem = iconName || textVariant;
    const actualIconName = iconName || iconNameLegacy;

    const content = (
      <>
        {/* Icon rendering with badge support */}
        {actualIconName && showInfoDot && (
          <BadgeWrapper
            badge={<BadgeStatus status={BadgeStatusStatus.New} />}
            position={BadgeWrapperPosition.TopRight}
            positionXOffset={4}
          >
            {useNewSystem && iconName && (
              <Icon
                name={iconName}
                size={iconSize || IconSize.Md}
                className="mr-2"
              />
            )}
            {!useNewSystem && iconNameLegacy && (
              <IconLegacy
                name={iconNameLegacy}
                size={IconSizeLegacy.Sm}
                marginRight={2}
              />
            )}
          </BadgeWrapper>
        )}
        {actualIconName && !showInfoDot && (
          <>
            {useNewSystem && iconName && (
              <Icon
                name={iconName}
                size={iconSize || IconSize.Md}
                className="mr-3"
              />
            )}
            {!useNewSystem && iconNameLegacy && (
              <IconLegacy
                name={iconNameLegacy}
                size={IconSizeLegacy.Sm}
                marginRight={3}
                color={iconColorLegacy}
              />
            )}
          </>
        )}

        <div>
          {textVariant && (
            <Text variant={textVariant} asChild>
              <div>{children}</div>
            </Text>
          )}
          {!textVariant && textVariantLegacy && (
            <TextLegacy variant={textVariantLegacy} as="div">
              {children}
            </TextLegacy>
          )}
          {!textVariant && !textVariantLegacy && <div>{children}</div>}
          {subtitle && (
            <Text
              variant={TextVariant.BodyXs}
              color={TextColor.TextAlternative}
            >
              {subtitle}
            </Text>
          )}
        </div>
      </>
    );

    const baseClasses = twMerge(
      'grid grid-cols-[min-content_auto] items-center',
      'w-full p-4',
      'text-start text-inherit [font-size:inherit]',
      'bg-transparent cursor-pointer',
      'hover:bg-default-hover hover:text-inherit',
      'active:bg-default-pressed active:text-inherit',
      'focus:outline focus:outline-2 focus:outline-primary-default focus:-outline-offset-2',
      'first:rounded-t-lg last:rounded-b-lg',
      className,
    );

    if (to) {
      return disabled ? (
        <span
          className={baseClasses}
          data-testid={dataTestId}
          ref={ref as React.Ref<HTMLSpanElement>}
        >
          {content}
        </span>
      ) : (
        <Link
          to={to}
          className={baseClasses}
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
        className={baseClasses}
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
