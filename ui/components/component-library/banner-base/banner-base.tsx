import React from 'react';
import classnames from 'classnames';

import {
  BackgroundColor,
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

        <div>
          {title && (
            <Text
              className="mm-banner-base__title"
              variant={TextVariant.bodyLgMedium}
              data-testid="mm-banner-base-title"
              as="h5"
              {...titleProps}
            >
              {title}
            </Text>
          )}
          {description && <Text {...descriptionProps}>{description}</Text>}
          {children && typeof children === 'object' ? (
            children
          ) : (
            <Text>{children}</Text>
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
        </div>
        {onClose && (
          <ButtonIcon
            className="mm-banner-base__close-button"
            marginLeft="auto"
            iconName={IconName.Close}
            size={ButtonIconSize.Sm}
            ariaLabel="Close" // TODO: i18n
            onClick={onClose}
            {...closeButtonProps}
          />
        )}
      </Box>
    );
  },
);
