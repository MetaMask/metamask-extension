import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Box from '../../ui/box';
import { Text } from '../text';

import {
  ALIGN_ITEMS,
  BUTTON_SIZES,
  JUSTIFY_CONTENT,
  TEXT_COLORS,
  DISPLAY,
} from '../../../helpers/constants/design-system';

export const ButtonBase = ({
  className,
  size = BUTTON_SIZES.MD,
  as = 'button',
  block,
  children,
  loading,
  disabled,
  ...props
}) => {
  return (
    <Box
      as={as}
      paddingLeft={size === BUTTON_SIZES.ZERO_PADDING ? 0 : 4}
      paddingRight={size === BUTTON_SIZES.ZERO_PADDING ? 0 : 4}
      display={block ? DISPLAY.BLOCK : DISPLAY.INLINE_BLOCK}
      className={classnames(
        'mm-button',
        `mm-button-size--${size}`,
        {
          [`mm-button--loading`]: Boolean(loading),
          [`mm-button--disabled`]: Boolean(disabled),
        },
        className,
      )}
      {...props}
    >
      <Text
        as="span"
        className="mm-button--content"
        alignItems={ALIGN_ITEMS.CENTER}
        justifyContent={JUSTIFY_CONTENT.CENTER}
        gap={2}
        color={TEXT_COLORS.INHERIT}
      >
        {children}
      </Text>
      {loading && <div className="spinner"></div>}
    </Box>
  );
};

ButtonBase.propTypes = {
  /**
   * The size of the ButtonBase.
   * Possible values could be 'BUTTON_SIZES.XS', 'BUTTON_SIZES.SM', 'BUTTON_SIZES.MD', 'BUTTON_SIZES.LG',
   */
  size: PropTypes.oneOf(Object.values(BUTTON_SIZES)),
  /**
   * The polymorphic `as` prop allows you to change the root HTML element of the Button component between `button` and `a` tag
   */
  as: PropTypes.string,
  /**
   * Boolean prop to quickly activate box prop display block
   */
  block: PropTypes.bool,
  /**
   * Boolean to show loading spinner in button
   */
  loading: PropTypes.bool,
  /**
   * Boolean to disable button
   */
  disabled: PropTypes.bool,
  /**
   * An additional className to apply to the icon.
   */
  className: PropTypes.string,
  /**
   * The children to be rendered inside the ButtonBase
   */
  children: PropTypes.node,
  /**
   * ButtonBase accepts all the props from Box
   */
  ...Box.propTypes,
};
