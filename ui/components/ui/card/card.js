import React from 'react';
import PropTypes from 'prop-types';

import Box from '../box';
import {
  BORDER_STYLE,
  COLORS,
  SIZES,
} from '../../../helpers/constants/design-system';

const Card = ({
  border = true,
  padding = 4,
  backgroundColor = COLORS.BACKGROUND_DEFAULT,
  children,
  ...props
}) => {
  const defaultBorderProps = {
    borderColor: border && COLORS.BORDER_MUTED,
    borderRadius: border && SIZES.MD,
    borderStyle: border && BORDER_STYLE.SOLID,
  };

  return (
    <Box
      {...{
        padding,
        backgroundColor,
        ...defaultBorderProps,
        ...props,
      }}
    >
      {children}
    </Box>
  );
};

Card.propTypes = {
  /**
   * Whether the Card has a border or not.
   * Defaults to true
   */
  border: PropTypes.bool,
  /**
   * Padding of the Card component accepts number or an array of 2 numbers.
   * Defaults to 4 (16px)
   */
  padding: Box.propTypes.padding,
  /**
   * The background color of the card
   * Defaults to COLORS.BACKGROUND_DEFAULT
   */
  backgroundColor: Box.propTypes.backgroundColor,
  /**
   * The Card component accepts all Box component props
   */
  ...Box.propTypes,
};

export default Card;
