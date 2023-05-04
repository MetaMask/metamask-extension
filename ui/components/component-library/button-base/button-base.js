import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Box from '../../ui/box';
import { IconName, Icon, IconSize } from '../icon';
import { Text } from '../text';

import {
  AlignItems,
  DISPLAY,
  JustifyContent,
  TextColor,
  TextVariant,
  BorderRadius,
  BackgroundColor,
  IconColor,
} from '../../../helpers/constants/design-system';
import { BUTTON_BASE_SIZES } from './button-base.constants';

export const ButtonBase = ({
  as = 'button',
  block,
  children,
  className,
  href,
  ellipsis = false,
  externalLink,
  size = BUTTON_BASE_SIZES.MD,
  startIconName,
  startIconProps,
  endIconName,
  endIconProps,
  loading,
  disabled,
  iconLoadingProps,
  textProps,
  color = TextColor.textDefault,
  ...props
}) => {
  const Tag = href ? 'a' : as;
  if (Tag === 'a' && externalLink) {
    props.target = '_blank';
    props.rel = 'noopener noreferrer';
  }
  return (
    <Text
      as={Tag}
      backgroundColor={BackgroundColor.backgroundAlternative}
      color={loading ? TextColor.transparent : color}
      href={href}
      paddingLeft={4}
      paddingRight={4}
      ellipsis={ellipsis}
      className={classnames(
        'mm-button-base',
        {
          [`mm-button-base--size-${size}`]:
            Object.values(BUTTON_BASE_SIZES).includes(size),
          'mm-button-base--loading': loading,
          'mm-button-base--disabled': disabled,
          'mm-button-base--block': block,
          'mm-button-base--ellipsis': ellipsis,
        },
        className,
      )}
      disabled={disabled}
      display={DISPLAY.INLINE_FLEX}
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
          color={color}
          size={IconSize.Md}
          {...iconLoadingProps}
        />
      )}
    </Text>
  );
};

ButtonBase.propTypes = {
  /**
   * The polymorphic `as` prop allows you to change the root HTML element of the Button component between `button` and `a` tag
   */
  as: PropTypes.string,
  /**
   * Boolean prop to quickly activate box prop display block
   */
  block: PropTypes.bool,
  /**
   * Additional props to pass to the Text component that wraps the button children
   */
  buttonTextProps: PropTypes.shape(Text.PropTypes),
  /**
   * The children to be rendered inside the ButtonBase
   */
  children: PropTypes.node,
  /**
   * An additional className to apply to the ButtonBase.
   */
  className: PropTypes.string,
  /**
   * Boolean to disable button
   */
  disabled: PropTypes.bool,
  /**
   * When an `href` prop is passed, ButtonBase will automatically change the root element to be an `a` (anchor) tag
   */
  href: PropTypes.string,
  /**
   * Used for long strings that can be cut off...
   */
  ellipsis: PropTypes.bool,
  /**
   * Boolean indicating if the link targets external content, it will cause the link to open in a new tab
   */
  externalLink: PropTypes.bool,
  /**
   * Add icon to start (left side) of button text passing icon name
   * The name of the icon to display. Should be one of IconName
   */
  startIconName: PropTypes.oneOf(Object.values(IconName)),
  /**
   * iconProps accepts all the props from Icon
   */
  startIconProps: PropTypes.object,
  /**
   * Add icon to end (right side) of button text passing icon name
   * The name of the icon to display. Should be one of IconName
   */
  endIconName: PropTypes.oneOf(Object.values(IconName)),
  /**
   * iconProps accepts all the props from Icon
   */
  endIconProps: PropTypes.object,
  /**
   * iconLoadingProps accepts all the props from Icon
   */
  iconLoadingProps: PropTypes.object,
  /**
   * Boolean to show loading spinner in button
   */
  loading: PropTypes.bool,
  /**
   * The size of the ButtonBase.
   * Possible values could be 'Size.SM'(32px), 'Size.MD'(40px), 'Size.LG'(48px),
   */
  size: PropTypes.oneOfType([
    PropTypes.shape(BUTTON_BASE_SIZES),
    PropTypes.string,
  ]),
  /**
   * textProps accepts all the props from Icon
   */
  textProps: PropTypes.shape(Text.PropTypes),
  /**
   * ButtonBase accepts all the props from Box
   */
  ...Box.propTypes,
};
