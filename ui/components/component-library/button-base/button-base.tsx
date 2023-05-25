import React, { Ref, forwardRef } from 'react';
import classnames from 'classnames';
import { IconName, Icon, IconSize } from '../icon';
import { Text, ValidTag } from '../text';
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
import { ButtonBaseProps, ButtonBaseSize } from './button-base.types';

export const ButtonBase = forwardRef(
  (
    {
      as = ValidTag.Button,
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
    }: ButtonBaseProps,
    ref: Ref<HTMLElement>,
  ) => {
    const Tag = href ? ValidTag.A : as;
    if (Tag === ValidTag.A && externalLink) {
      props.target = '_blank';
      props.rel = 'noopener noreferrer';
    }

    return (
      <Text
        as={Tag}
        backgroundColor={BackgroundColor.backgroundAlternative}
        color={loading ? TextColor.transparent : color}
        ref={ref}
        href={href}
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
        disabled={disabled}
        display={Display.InlineFlex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        borderRadius={BorderRadius.pill}
        {...props}
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
            as={ValidTag.Span}
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
