import React from 'react';
import classnames from 'classnames';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  IconColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  AvatarFavicon,
  ButtonLink,
  Box,
  IconName,
  Icon,
  IconSize,
  Text,
  ButtonLinkSize,
} from '..';
import { BoxProps, PolymorphicRef } from '../box';
import { TagUrlComponent, TagUrlProps } from './tag-url.types';

export const TagUrl: TagUrlComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      label,
      labelProps,
      actionButtonLabel,
      actionButtonProps,
      src,
      showLockIcon,
      avatarFaviconProps,
      lockIconProps,
      className = '',
      ...props
    }: TagUrlProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    return (
      <Box
        className={classnames('mm-tag-url', className)}
        ref={ref}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderColor={BorderColor.borderDefault}
        borderWidth={1}
        alignItems={AlignItems.center}
        paddingLeft={2}
        paddingRight={4}
        gap={2}
        borderRadius={BorderRadius.pill}
        display={Display.Flex}
        {...(props as BoxProps<C>)}
      >
        <AvatarFavicon src={src} name={label} {...avatarFaviconProps} />
        {showLockIcon && (
          <Icon
            className="mm-tag-url__lock-icon"
            name={IconName.Lock}
            color={IconColor.iconAlternative}
            size={IconSize.Sm}
            aria-label="https://"
            role="img"
            {...lockIconProps}
          />
        )}
        <Text variant={TextVariant.bodyMd} ellipsis {...labelProps}>
          {label}
        </Text>
        {actionButtonLabel && (
          <ButtonLink
            as="a"
            size={ButtonLinkSize.Sm}
            paddingLeft={0}
            paddingRight={0}
            marginLeft={2}
            marginRight={2}
            {...actionButtonProps}
          >
            {actionButtonLabel}
          </ButtonLink>
        )}
      </Box>
    );
  },
);
