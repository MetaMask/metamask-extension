import React from 'react';
import PropTypes from 'prop-types';

import Box from '../box';
import {
  BackgroundColor,
  BorderColor,
  BorderRadius,
  BorderStyle,
} from '../../../helpers/constants/design-system';

const Card = ({
  border = true,
  backgroundColor = BackgroundColor.backgroundDefault,
  children,
  ...props
}) => (
  <Box
    borderColor={border ? BorderColor.borderMuted : null}
    borderRadius={border ? BorderRadius.MD : null}
    borderStyle={border ? BorderStyle.solid : null}
    backgroundColor={backgroundColor}
    padding={4}
    {...props}
  >
    {children}
  </Box>
);

Card.propTypes = {
  /**
   * Whether the Card has a border or not.
   * Defaults to true
   */
  border: PropTypes.bool,
  /**
   * The background color of the card
   * Defaults to Color.backgroundDefault
   */
  backgroundColor: PropTypes.oneOf(Object.values(BackgroundColor)),
  /**
   * The Card component accepts all Box component props
   */
  ...Box.propTypes,
};

export default Card;
