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
} from '../../../helpers/constants/design-system';
import { BUTTON_SIZES } from './button.constants';

export const ButtonBase = ({
  as = 'button',
  block,
  children,
  className,
  size = BUTTON_SIZES.MD,
  icon,
  iconPositionRight,
  loading,
  disabled,
  iconProps,
  ...props
}) => {
  const Tag = props?.href ? 'a' : as;
  return (
    <Box
      as={Tag}
      paddingLeft={size === BUTTON_SIZES.AUTO ? 0 : 4}
      paddingRight={size === BUTTON_SIZES.AUTO ? 0 : 4}
      className={classnames(
        'mm-button',
        `mm-button--size-${size}`,
        {
          'mm-button--loading': loading,
          'mm-button--disabled': disabled,
          'mm-button--block': block,
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
        className="mm-button__content"
        alignItems={ALIGN_ITEMS.CENTER}
        justifyContent={JUSTIFY_CONTENT.CENTER}
        flexDirection={
          iconPositionRight ? FLEX_DIRECTION.ROW_REVERSE : FLEX_DIRECTION.ROW
        }
        gap={2}
        variant={size === BUTTON_SIZES.AUTO ? TEXT.INHERIT : TEXT.BODY_MD}
        color={TEXT_COLORS.INHERIT}
      >
        {icon && (
          <Icon
            name={icon}
            size={size === BUTTON_SIZES.AUTO ? SIZES.AUTO : SIZES.SM}
            {...iconProps}
          />
        )}
        {children}
      </Text>
      {loading && (
        <Icon
          className="mm-button__icon-loading"
          name={ICON_NAMES.LOADING_FILLED}
          size={size === BUTTON_SIZES.AUTO ? SIZES.AUTO : SIZES.MD}
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
   * Add icon to left side of button text passing icon name
   * The name of the icon to display. Should be one of ICON_NAMES
   */
  icon: PropTypes.string, // Can't set PropTypes.oneOf(ICON_NAMES) because ICON_NAMES is an environment variable
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
   * Possible values could be 'SIZES.AUTO', 'SIZES.SM', 'SIZES.MD', 'SIZES.LG',
   */
  size: PropTypes.oneOf(Object.values(BUTTON_SIZES)),
  /**
   * Addition style properties to apply to the button.
   */
  style: PropTypes.object,
  /**
   * ButtonBase accepts all the props from Box
   */
  ...Box.propTypes,
};
