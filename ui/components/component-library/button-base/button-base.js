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
  COLORS,
  TEXT,
  SIZES,
  FLEX_DIRECTION,
  BORDER_RADIUS,
} from '../../../helpers/constants/design-system';
import { BUTTON_BASE_SIZES } from './button-base.constants';

export const ButtonBase = ({
  block,
  children,
  className,
  size = BUTTON_BASE_SIZES.MD,
  iconName,
  iconPositionRight,
  loading,
  disabled,
  iconProps,
  buttonTextProps,
  ...props
}) => (
  <Box
    as="button"
    paddingLeft={4}
    paddingRight={4}
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
    color={COLORS.TEXT_DEFAULT}
    backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
    borderColor={COLORS.BORDER_DEFAULT}
    {...props}
  >
    <Text
      as="span"
      className="mm-button-base__content"
      display={DISPLAY.INLINE_FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      flexDirection={
        iconPositionRight ? FLEX_DIRECTION.ROW_REVERSE : FLEX_DIRECTION.ROW
      }
      gap={2}
      variant={TEXT.BODY_MD}
      color={COLORS.INHERIT}
      {...buttonTextProps}
    >
      {iconName && <Icon name={iconName} size={SIZES.SM} {...iconProps} />}
      {children}
    </Text>
    {loading && (
      <Icon
        className="mm-button-base__icon-loading"
        name={ICON_NAMES.LOADING_FILLED}
        size={SIZES.MD}
      />
    )}
  </Box>
);

ButtonBase.propTypes = {
  /**
   * Boolean prop to quickly activate box prop display block
   */
  block: PropTypes.bool,
  /**
   * The children to be rendered inside the ButtonBase
   */
  children: PropTypes.node,
  /**
   * Additional props to pass to the Text component that wraps the button children
   */
  buttonTextProps: PropTypes.shape(Text.PropTypes),
  /**
   * An additional className to apply to the ButtonBase.
   */
  className: PropTypes.string,
  /**
   * Boolean to disable button
   */
  disabled: PropTypes.bool,
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
   * Possible values could be 'SIZES.SM'(32px), 'SIZES.MD'(40px), 'SIZES.LG'(48px),
   */
  size: PropTypes.oneOf(Object.values(BUTTON_BASE_SIZES)),
  /**
   * ButtonBase accepts all the props from Box
   */
  ...Box.propTypes,
};
