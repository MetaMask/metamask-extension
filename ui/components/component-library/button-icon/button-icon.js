import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Box from '../../ui/box';
import { Icon } from '../icon';

import {
  ALIGN_ITEMS,
  DISPLAY,
  JUSTIFY_CONTENT,
  SIZES,
} from '../../../helpers/constants/design-system';
import { BUTTON_ICON_SIZES } from './button-icon.constants';

export const ButtonIcon = ({
  as = 'button',
  // children,
  className,
  size = BUTTON_ICON_SIZES.MD,
  icon,
  disabled,
  ...props
}) => {
  return (
    <Box
      as={as}
      paddingLeft={size === BUTTON_ICON_SIZES.AUTO ? 0 : 4}
      paddingRight={size === BUTTON_ICON_SIZES.AUTO ? 0 : 4}
      className={classnames(
        'mm-button-icon',
        `mm-button-icon--size-${size}`,
        {
          'mm-button-icon--disabled': disabled,
        },
        className,
      )}
      disabled={disabled}
      display={DISPLAY.INLINE_FLEX}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      alignItems={ALIGN_ITEMS.CENTER}
      {...props}
    >
      <Icon
        name={icon}
        size={size === BUTTON_ICON_SIZES.AUTO ? SIZES.AUTO : SIZES.SM}
      />
    </Box>
  );
};

ButtonIcon.propTypes = {
  /**
   * The polymorphic `as` prop allows you to change the root HTML element of the Button component between `button` and `a` tag
   */
  as: PropTypes.string,
  /**
   * Boolean prop to quickly activate box prop display block
   */
  block: PropTypes.bool,
  /**
   * The children to be rendered inside the ButtonIcon
   */
  children: PropTypes.node,
  /**
   * An additional className to apply to the ButtonIcon.
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
   * The size of the ButtonIcon.
   * Possible values could be 'SIZES.AUTO', 'SIZES.SM', 'SIZES.MD', 'SIZES.LG',
   */
  size: PropTypes.oneOf(Object.values(BUTTON_ICON_SIZES)),
  /**
   * Addition style properties to apply to the button.
   */
  style: PropTypes.object,
  /**
   * ButtonIcon accepts all the props from Box
   */
  ...Box.propTypes,
};
