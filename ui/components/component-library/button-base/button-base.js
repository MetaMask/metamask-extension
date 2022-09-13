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
} from '../../../helpers/constants/design-system';

export const ButtonBase = ({
  className,
  size = BUTTON_SIZES.MD,
  as = 'button',
  children,
  isBlock,
  isLoading,
  ...props
}) => {
  return (
    <Box
      as={as}
      paddingLeft={size === BUTTON_SIZES.XS ? 0 : 4}
      paddingRight={size === BUTTON_SIZES.XS ? 0 : 4}
      className={classnames(className, 'mm-button', `mm-button-size--${size}`, {
        [`mm-button--block`]: Boolean(isBlock),
        [`mm-button--loading`]: Boolean(isLoading),
      })}
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
      {isLoading && <div className="spinner"></div>}
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
   * The polymorphic `as` prop allows you to change the root HTML element of the Button component
   */
  as: PropTypes.string,
  /**
   * isBlock is boolean prop that will set button to full width when true
   */
  isBlock: PropTypes.bool,
  /**
   * Boolean to show loading wheel in button
   */
  isLoading: PropTypes.bool,
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
