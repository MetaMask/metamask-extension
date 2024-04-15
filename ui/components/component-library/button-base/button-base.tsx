import React from 'react';
import classnames from 'classnames';
import { IconName, Icon, IconSize, Text } from '..';
import {
  AlignItems,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
  BorderRadius,
  BackgroundColor,
  IconColor,
} from '../../../helpers/constants/design-system';
import type { PolymorphicRef } from '../box';
import type { TextProps } from '../text';
import {
  ButtonBaseProps,
  ButtonBaseSize,
  ButtonBaseComponent,
} from './button-base.types';

export const ButtonBase: ButtonBaseComponent = React.forwardRef(
  <C extends React.ElementType = 'button' | 'a'>(
    {
      as,
      block,
      children,
      className = '',
      href,
      ellipsis = false,
      externalLink,
      size = ButtonBaseSize.Md,
      startIconName,
      startIconProps,
      endIconName,
      endIconProps,
      loading,
      disabled,
      iconLoadingProps,
      textProps,
      color = TextColor.textDefault,
      iconColor = IconColor.iconDefault,
      ...props
    }: ButtonBaseProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const tag = href ? 'a' : as || 'button';
    const tagProps = href && tag === 'a' ? { href, ...props } : props;

    return (
      <Text
        as={tag}
        backgroundColor={BackgroundColor.backgroundAlternative}
        variant={TextVariant.bodyMdMedium}
        color={loading ? TextColor.transparent : color}
        ref={ref}
        {...(tag === 'button' ? { disabled } : {})}
        {...(href && externalLink
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
        padding={0}
        paddingLeft={4}
        paddingRight={4}
        ellipsis={ellipsis}
        className={classnames(
          'mm-button-base',
          {
            [`mm-button-base--size-${size}`]:
              Object.values(ButtonBaseSize).includes(size),
            'mm-button-base--loading': loading || false,
            'mm-button-base--disabled': disabled || false,
            'mm-button-base--block': block || false,
            'mm-button-base--ellipsis': ellipsis,
          },
          className,
        )}
        display={Display.InlineFlex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        borderRadius={BorderRadius.pill}
        {...(tagProps as TextProps<C>)}
      >
        {startIconName && (
          <Icon
            name={startIconName}
            size={IconSize.Sm}
            marginInlineEnd={1}
            {...startIconProps}
            color={loading ? IconColor.transparent : startIconProps?.color}
          />
        )}
        {/*
         * If children is a string and doesn't need truncation or loading
         * prevent html bloat by rendering just the string
         * otherwise render with wrapper to allow truncation or loading
         */}
        {typeof children === 'string' && !ellipsis && !loading ? (
          children
        ) : (
          <Text
            as="span"
            ellipsis={ellipsis}
            variant={TextVariant.inherit}
            color={loading ? TextColor.transparent : color}
            {...textProps}
          >
            {children}
          </Text>
        )}
        {endIconName && (
          <Icon
            name={endIconName}
            size={IconSize.Sm}
            marginInlineStart={1}
            {...endIconProps}
            color={loading ? IconColor.transparent : endIconProps?.color}
          />
        )}
        {loading && (
          <Icon
            className="mm-button-base__icon-loading"
            name={IconName.Loading}
            color={iconColor}
            size={IconSize.Md}
            {...iconLoadingProps}
          />
        )}
      </Text>
    );
  },
);
