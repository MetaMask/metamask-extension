import React from 'react';
import { Box, BoxProps } from '../../../../component-library';
import {
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';

export const SendPageRow = React.forwardRef<HTMLDivElement, BoxProps<'div'>>(
  ({ children, ...boxProps }, ref) => (
    <Box
      ref={ref}
      display={Display.Flex}
      paddingBottom={4}
      flexDirection={FlexDirection.Column}
      {...boxProps}
    >
      {children}
    </Box>
  ),
);
