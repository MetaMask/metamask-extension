import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Box from '../../../ui/box';
import { Text } from '../../text';

import {
  ALIGN_ITEMS,
  BUTTON_SIZES,
  JUSTIFY_CONTENT,
  TEXT_COLORS,
} from '../../../../helpers/constants/design-system';

export const BaseButton = ({
  className,
  size = BUTTON_SIZES.MD,
  as = 'button',
  children,
  isBlock,
  ...props
}) => {
  return (
    <Box
      as={as}
      paddingLeft={size === BUTTON_SIZES.XS ? 0 : 4}
      paddingRight={size === BUTTON_SIZES.XS ? 0 : 4}
      className={classnames(
        className,
        'base-button',
        `base-button-size--${size}`,
        {
          [`base-button--block`]: Boolean(isBlock),
        },
      )}
      {...props}
    >
      <Text
        as="span"
        className="base-button--content"
        alignItems={ALIGN_ITEMS.CENTER}
        justifyContent={JUSTIFY_CONTENT.CENTER}
        gap={2}
        color={TEXT_COLORS.INHERIT}
      >
        {children}
      </Text>
    </Box>
  );
};

BaseButton.propTypes = {
  /**
   * The size of the BaseButton.
   * Possible values could be 'BUTTON_SIZES.XS', 'BUTTON_SIZES.SM', 'BUTTON_SIZES.MD', 'BUTTON_SIZES.LG', 'BUTTON_SIZES.XL',
   * Default value is 'BUTTON_SIZES.MD'.
   */
  size: PropTypes.oneOf(Object.values(BUTTON_SIZES)),
  /**
   * An additional className to apply to the icon.
   */
  as: PropTypes.string,
  /**
   * isBlock is boolean prop that will set button to full width when true
   */
  isBlock: PropTypes.boolean,
  /**
   * An additional className to apply to the icon.
   */
  className: PropTypes.string,
  /**
   * The children to be rendered inside the BaseButton
   */
  children: PropTypes.node,
  /**
   * BaseButton accepts all the props from Box
   */
  ...Box.propTypes,
};
