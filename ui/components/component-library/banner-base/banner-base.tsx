import React from 'react';
import classnames from 'classnames';
import { useI18nContext } from '../../../hooks/useI18nContext';

import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  TextVariant,
} from '../../../helpers/constants/design-system';

import {
  ButtonLink,
  IconName,
  ButtonIcon,
  Text,
  Box,
  ButtonLinkSize,
  ButtonIconSize,
} from '..';
import { BoxProps, PolymorphicRef } from '../box';
import { BannerBaseComponent, BannerBaseProps } from './banner-base.types';

export const BannerBase: BannerBaseComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      className = '',
      title,
      titleProps,
      description,
      descriptionProps,
      children,
      childrenWrapperProps,
      actionButtonLabel,
      actionButtonOnClick,
      actionButtonProps,
      startAccessory,
      onClose,
      closeButtonProps,
      ...props
    }: BannerBaseProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const t = useI18nContext();
    return (
      <Box
        className={classnames('mm-banner-base', className)}
        ref={ref}
        display={Display.Flex}
        gap={2}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.SM}
        padding={3}
        {...(props as BoxProps<C>)}
      >
        {startAccessory && <>{startAccessory}</>}

        {/* min-Width: 0 style is used to prevent grid/flex blowout */}
        <Box minWidth={BlockSize.Zero}>
          {title && (
            <Text variant={TextVariant.bodyLgMedium} {...titleProps}>
              {title}
            </Text>
          )}
          {description && <Text {...descriptionProps}>{description}</Text>}
          {children && typeof children === 'object' ? (
            children
          ) : (
            <Text {...childrenWrapperProps}>{children}</Text>
          )}
          {actionButtonLabel && (
            <ButtonLink
              size={ButtonLinkSize.Auto}
              onClick={actionButtonOnClick}
              {...actionButtonProps}
            >
              {actionButtonLabel}
            </ButtonLink>
          )}
        </Box>

        {onClose && (
          <ButtonIcon
            className="mm-banner-base__close-button"
            marginLeft="auto"
            iconName={IconName.Close}
            size={ButtonIconSize.Sm}
            ariaLabel={t('close')}
            onClick={onClose}
            {...closeButtonProps}
          />
        )}
      </Box>
    );
  },
);
