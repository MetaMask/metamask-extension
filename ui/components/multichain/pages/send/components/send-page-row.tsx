import React from 'react';
import { Box } from '../../../../component-library';
import {
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';

export const SendPageRow = ({
  children,
}: {
  children: React.ReactNode | React.ReactNode[];
}) => (
  <Box
    display={Display.Flex}
    paddingBottom={6}
    flexDirection={FlexDirection.Column}
  >
    {children}
  </Box>
);
