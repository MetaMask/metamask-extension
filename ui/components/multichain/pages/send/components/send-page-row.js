import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '../../../../component-library';
import {
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';

export const SendPageRow = ({ children }) => (
  <Box
    display={Display.Flex}
    paddingBottom={6}
    flexDirection={FlexDirection.Column}
  >
    {children}
  </Box>
);

SendPageRow.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string,
  ]).isRequired,
};
