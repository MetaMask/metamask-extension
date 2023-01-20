import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Box from '../../ui/box';
import { Icon, ICON_NAMES } from '../icon';
import { Text } from '../text';

import {
  ALIGN_ITEMS,
  DISPLAY,
  JUSTIFY_CONTENT,
  TEXT_COLORS,
  TEXT,
  SIZES,
  FLEX_DIRECTION,
  BORDER_RADIUS,
  COLORS,
} from '../../../helpers/constants/design-system';
import { BUTTON_BASE_SIZES } from './button-base.constants';

export const ButtonBase = ({
  as = 'button',
  block,
  children,
  className,
  href,
  size = BUTTON_BASE_SIZES.MD,
  iconName,
  iconPositionRight,
  loading,
  disabled,
  iconProps,
  buttonTextProps,
  ...props
}) => {
  const Tag = href ? 'a' : as;
  return (
    <Box
      as={Tag}
      backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
      color={COLORS.TEXT_DEFAULT}
      href={href}
      paddingLeft={size === BUTTON_BASE_SIZES.AUTO ? 0 : 4}
      paddingRight={size === BUTTON_BASE_SIZES.AUTO ? 0 : 4}
      borderRadius={BORDER_RADIUS.PILL}
      className={classnames(
        'mm-button-base',
        `mm-button-base--size-${size}`,
        {
          'mm-button-base--loading': loading,
          'mm-button-base--disabled': disabled,
          'mm-button-base--block': block,
        },
        className,
      )}
      disabled={disabled}
      display={DISPLAY.INLINE_FLEX}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      alignItems={ALIGN_ITEMS.CENTER}
      {...props}
    >
      <Text
        as="span"
        className="mm-button-base__content"
        alignItems={ALIGN_ITEMS.CENTER}
        justifyContent={JUSTIFY_CONTENT.CENTER}
        flexDirection={
          iconPositionRight ? FLEX_DIRECTION.ROW_REVERSE : FLEX_DIRECTION.ROW
        }
        gap={2}
        variant={size === BUTTON_BASE_SIZES.AUTO ? TEXT.INHERIT : TEXT.BODY_MD}
        color={TEXT_COLORS.INHERIT}
        {...buttonTextProps}
      >
        {iconName && (
          <Icon
            name={iconName}
            size={size === BUTTON_BASE_SIZES.AUTO ? SIZES.AUTO : SIZES.SM}
            {...iconProps}
          />
        )}
        {children}
      </Text>
      {loading && (
        <Icon
          className="mm-button-base__icon-loading"
          name={ICON_NAMES.LOADING_FILLED}
          size={size === BUTTON_BASE_SIZES.AUTO ? SIZES.AUTO : SIZES.MD}
        />
      )}
    </Box>
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
   * Add icon to left side of button text passing icon name
   * The name of the icon to display. Should be one of ICON_NAMES
   */
  iconName: PropTypes.string, // Can't set PropTypes.oneOf(ICON_NAMES) because ICON_NAMES is an environment variable
  /**
   * Boolean that when true will position the icon on right of children
   * Icon default position left
   */
  iconPositionRight: PropTypes.bool,
  /**
   * iconProps accepts all the props from Icon
   */
  iconProps: PropTypes.object,
  /**
   * Boolean to show loading spinner in button
   */
  loading: PropTypes.bool,
  /**
   * The size of the ButtonBase.
   * Possible values could be 'SIZES.AUTO', 'SIZES.SM'(32px), 'SIZES.MD'(40px), 'SIZES.LG'(48px),
   */
  size: PropTypes.oneOf(Object.values(BUTTON_BASE_SIZES)),
  /**
   * ButtonBase accepts all the props from Box
   */
  ...Box.propTypes,
};
